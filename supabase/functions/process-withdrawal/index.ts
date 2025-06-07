/// <reference types="https://deno.land/x/deno/cli/types/dts/index.d.ts" />

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface ProcessWithdrawalPayload {
  withdrawal_request_id: string;
  action: 'approve' | 'reject';
  admin_notes?: string;
}

// Helper function to check if user is admin (you might have this in _shared or use RLS)
// This is a simplified check; a robust solution would use custom claims or a dedicated roles table.
async function isAdmin(supabase: SupabaseClient): Promise<boolean> {
  const { data: { user } , error } = await supabase.auth.getUser();
  if (error || !user) return false;
  // Assuming 'admin' role is stored in user_metadata or a separate table
  // For this example, let's assume a custom claim 'user_role' or check against a list of admin UIDs
  // This part needs to be adapted to your actual admin identification mechanism.
  // const { data: adminProfile, error: profileError } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  // return adminProfile?.role === 'admin';
  // For now, let's use an environment variable for a super admin UID for simplicity in this example.
  const SUPER_ADMIN_UID = Deno.env.get('SUPER_ADMIN_UID');
  if (SUPER_ADMIN_UID && user.id === SUPER_ADMIN_UID) {
    return true;
  }
  // A more realistic check might involve a 'user_roles' table or custom claims
  const { data: userRole, error: roleError } = await supabase
    .from('user_roles') // Assuming you have a user_roles table
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle();
  return !!userRole;
}


Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');


    if (!supabaseUrl || !supabaseServiceRoleKey || !supabaseAnonKey) {
      console.error('Supabase environment variables not set.');
      return new Response(JSON.stringify({ error: 'Server configuration error.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 
      });
    }
    
    const authHeader = req.headers.get('Authorization');
     if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Missing authorization header.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 
        });
    }

    // Client for checking admin status with user's JWT
    const supabaseUserClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
    });

    const adminCheck = await isAdmin(supabaseUserClient);
    if (!adminCheck) {
      return new Response(JSON.stringify({ error: 'Unauthorized. Admin access required.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 
      });
    }

    const payload: ProcessWithdrawalPayload = await req.json();
    const { withdrawal_request_id, action, admin_notes } = payload;

    if (!withdrawal_request_id || !action || (action !== 'approve' && action !== 'reject')) {
      return new Response(JSON.stringify({ error: 'Invalid payload. withdrawal_request_id and action (approve/reject) are required.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Fetch the withdrawal request to ensure it exists and is in 'pending' or 'processing_withdrawal' state
    const { data: withdrawalRequest, error: fetchError } = await supabaseAdmin
      .from('withdrawal_requests')
      .select('*')
      .eq('id', withdrawal_request_id)
      .single();

    if (fetchError || !withdrawalRequest) {
      console.error('Error fetching withdrawal request or not found:', fetchError);
      return new Response(JSON.stringify({ error: 'Withdrawal request not found.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 
      });
    }

    if (withdrawalRequest.status !== 'pending') {
         return new Response(JSON.stringify({ error: `Withdrawal request is already processed with status: ${withdrawalRequest.status}` }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 
        });
    }
    
    const now = new Date().toISOString();
    let updateWithdrawalData: any = { processed_at: now, admin_notes: admin_notes };
    let updateCommissionsData: any = {};

    if (action === 'approve') {
      updateWithdrawalData.status = 'approved'; // Or 'processed' if payment is done
      updateCommissionsData = { status: 'paid', paid_at: now };
      // In a real scenario, this is where you would trigger the actual bank transfer/payment to the affiliate.
      // Only after successful transfer should status be 'processed' or 'paid'.
      // For now, 'approved' means admin acknowledged it.
    } else { // action === 'reject'
      updateWithdrawalData.status = 'rejected';
      updateCommissionsData = { status: 'pending', withdrawal_request_id: null }; // Revert to pending, unlink
    }

    // Start a transaction if your Supabase client/setup supports it easily,
    // or handle potential partial failures carefully.
    // For Deno Edge Functions, true DB transactions across multiple statements are complex.
    // We'll proceed with sequential updates and log errors.

    const { error: updateWithdrawalError } = await supabaseAdmin
      .from('withdrawal_requests')
      .update(updateWithdrawalData)
      .eq('id', withdrawal_request_id);

    if (updateWithdrawalError) {
      console.error('Error updating withdrawal request status:', updateWithdrawalError);
      return new Response(JSON.stringify({ error: 'Failed to update withdrawal request.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 
      });
    }

    // Update associated commissions
    const { error: updateCommissionsError } = await supabaseAdmin
      .from('commissions')
      .update(updateCommissionsData)
      .eq('withdrawal_request_id', withdrawal_request_id);
      // Note: This updates all commissions linked. If only a partial amount was approved (not in this design),
      // this logic would need to be more granular.

    if (updateCommissionsError) {
      console.error('Error updating commissions status:', updateCommissionsError);
      // Potentially try to revert withdrawal_request status or log for manual intervention
      return new Response(JSON.stringify({ error: 'Withdrawal request updated, but failed to update associated commissions.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 
      });
    }

    // TODO: Send notification email to affiliate about the status update.

    return new Response(JSON.stringify({ message: `Withdrawal request ${action}d successfully.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 
    });

  } catch (error) {
    console.error('Error in process-withdrawal function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 
    });
  }
});
