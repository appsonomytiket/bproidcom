import { createClient, SupabaseClient } from 'supabase';
import { corsHeaders } from '../_shared/cors.ts';

// Define UserRole directly to avoid path issues in Deno Edge Functions
type UserRole = 'admin' | 'affiliate' | 'customer';

interface ActivateAffiliatePayload {
  user_id_to_activate: string;
}
// Note: The duplicated import and interface lines above were removed by this SEARCH/REPLACE
// The `import { corsHeaders } from '../_shared/cors.ts';` is already present at the top.

// Helper function to check if user is admin (consistent with other functions)
async function isAdmin(supabase: SupabaseClient): Promise<boolean> {
  const { data: { user } , error } = await supabase.auth.getUser();
  if (error || !user) return false;
  
  const SUPER_ADMIN_UID = Deno.env.get('SUPER_ADMIN_UID');
  if (SUPER_ADMIN_UID && user.id === SUPER_ADMIN_UID) {
    return true;
  }

  // Fetch roles from 'users' table
  const { data: userData, error: userFetchError } = await supabase
    .from('users')
    .select('roles')
    .eq('id', user.id)
    .single();

  if (userFetchError || !userData || !userData.roles) return false;
  
  return (userData.roles as UserRole[]).includes('admin');
}

// Helper function to generate referral code (consistent with midtrans-webhook)
// Consider moving to _shared/utils.ts if used in multiple places
function generateReferralCode(name: string): string {
  const namePart = name.substring(0, 3).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${namePart}${randomPart}`;
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

    const supabaseUserClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
    });

    const adminCheck = await isAdmin(supabaseUserClient);
    if (!adminCheck) {
      return new Response(JSON.stringify({ error: 'Unauthorized. Admin access required.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 
      });
    }

    const payload: ActivateAffiliatePayload = await req.json();
    const { user_id_to_activate } = payload;

    if (!user_id_to_activate) {
      return new Response(JSON.stringify({ error: 'Invalid payload. user_id_to_activate is required.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Fetch the user to activate
    const { data: targetUser, error: fetchUserError } = await supabaseAdmin
      .from('users')
      .select('id, referral_code, full_name, roles') // Added roles
      .eq('id', user_id_to_activate)
      .single();

    if (fetchUserError || !targetUser) {
      console.error('Error fetching user to activate or user not found:', fetchUserError);
      return new Response(JSON.stringify({ error: 'Target user not found.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404
      });
    }

    let currentRoles = (targetUser.roles || []) as UserRole[];
    const isAlreadyAffiliateRole = currentRoles.includes('affiliate');
    const hasReferralCode = !!targetUser.referral_code;
    let finalReferralCode = targetUser.referral_code;
    let needsCodeGeneration = false;
    let needsRoleUpdate = !isAlreadyAffiliateRole;
    let updatePayload: { referral_code?: string; roles?: UserRole[] } = {};

    if (isAlreadyAffiliateRole && hasReferralCode) {
      return new Response(JSON.stringify({ message: 'User is already an active affiliate.', referral_code: targetUser.referral_code, roles: currentRoles }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
      });
    }

    if (!hasReferralCode) {
      finalReferralCode = generateReferralCode(targetUser.full_name || 'USER');
      updatePayload.referral_code = finalReferralCode;
      needsCodeGeneration = true; // To handle potential unique constraint error specifically for code
    }
    
    if (needsRoleUpdate) {
      const updatedRoles = [...new Set([...currentRoles, 'affiliate'])]; // Add 'affiliate' if not present, ensure uniqueness
      updatePayload.roles = updatedRoles;
    }

    if (Object.keys(updatePayload).length === 0) {
       // This case should ideally not be hit if the first check (isAlreadyAffiliateRole && hasReferralCode) is comprehensive
       return new Response(JSON.stringify({ message: 'User is already configured as an affiliate.', referral_code: targetUser.referral_code, roles: currentRoles }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
      });
    }
    
    const { data: updatedUserData, error: updateUserError } = await supabaseAdmin
      .from('users')
      .update(updatePayload)
      .eq('id', user_id_to_activate)
      .select('id, referral_code, roles') // Select the fields to return
      .single();

    if (updateUserError) {
      console.error('Error updating user:', updateUserError);
      if (needsCodeGeneration && updateUserError.message.includes('duplicate key value violates unique constraint')) {
           return new Response(JSON.stringify({ error: 'Failed to generate a unique referral code. Please try again.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500
          });
      }
      return new Response(JSON.stringify({ error: 'Failed to activate/update affiliate status.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500
      });
    }

    // Ensure updatedUserData is not null before accessing its properties
    if (!updatedUserData) {
      // This case should ideally not happen if the update was successful without error
      console.error('Updated user data is null after successful update without error.');
      return new Response(JSON.stringify({ error: 'Failed to retrieve updated user data.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500
      });
    }
    
    return new Response(JSON.stringify({ 
      message: 'User affiliate status successfully updated.', 
      user_id: updatedUserData.id, 
      referral_code: updatedUserData.referral_code,
      roles: updatedUserData.roles as UserRole[] // Cast to UserRole[]
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
    });

  } catch (error: any) {
    console.error('Error in activate-affiliate function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error: ' + error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 
    });
  }
});
