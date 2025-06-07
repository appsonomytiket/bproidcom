/// <reference types="https://deno.land/x/deno/cli/types/dts/index.d.ts" />

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface WithdrawalRequestPayload {
  requested_amount: number;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_holder_name?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase URL or Anon Key not provided.');
      return new Response(JSON.stringify({ error: 'Server configuration error.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }
    
    // Create Supabase client with the user's JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Missing authorization header.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 
        });
    }
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
    });

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Error fetching user or no user found:', userError);
      return new Response(JSON.stringify({ error: 'Authentication required.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const payload: WithdrawalRequestPayload = await req.json();
    const { requested_amount, bank_name, bank_account_number, bank_account_holder_name } = payload;

    if (!requested_amount || requested_amount <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid requested amount.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    
    // TODO: Add check for minimum withdrawal amount from admin_settings

    // Use a service role client for operations requiring elevated privileges like checking balances
    // or if RLS prevents direct sum calculation by the user.
    // For this example, we assume RLS allows user to see their commissions.
    // A more robust approach might use a DB function to calculate available balance.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Calculate user's available commission balance (status = 'pending' and not part of another request)
    const { data: commissions, error: commissionError } = await supabaseAdmin
      .from('commissions')
      .select('id, amount, created_at') // Select id and created_at for sorting and update
      .eq('affiliate_user_id', user.id)
      .eq('status', 'pending') // Only 'pending' commissions are withdrawable
      .is('withdrawal_request_id', null); // Not already part of another request

    if (commissionError) {
      console.error('Error fetching commissions:', commissionError);
      return new Response(JSON.stringify({ error: 'Failed to calculate available balance.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const availableBalance = commissions?.reduce((sum: number, comm: { amount: number }) => sum + comm.amount, 0) || 0;

    if (requested_amount > availableBalance) {
      return new Response(JSON.stringify({ error: `Insufficient balance. Available: ${availableBalance}, Requested: ${requested_amount}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Insert withdrawal request
    const { data: withdrawalRequest, error: insertError } = await supabaseAdmin
      .from('withdrawal_requests')
      .insert({
        affiliate_user_id: user.id,
        requested_amount: requested_amount,
        status: 'pending',
        bank_name: bank_name,
        bank_account_number: bank_account_number,
        bank_account_holder_name: bank_account_holder_name,
      })
      .select()
      .single();

    if (insertError || !withdrawalRequest) {
      console.error('Error creating withdrawal request:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to create withdrawal request.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }
    
    // IMPORTANT: Associate commissions with this withdrawal request
    // This is a critical step to prevent double withdrawal of the same commissions.
    // We need to update the commissions that sum up to the requested_amount.
    // This logic can be complex: do we pick oldest first? Or allow user to select?
    // IMPORTANT: Associate commissions with this withdrawal request
    // This is a critical step to prevent double withdrawal of the same commissions.
    // We need to update the commissions that sum up to the requested_amount.
    // We pick oldest first.
    
    // Commissions should already be fetched with id, amount, and created_at
    const sortedCommissions = commissions?.sort((a: { created_at: string | number | Date }, b: { created_at: string | number | Date }) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) || [];
    
    let coveredAmount = 0;
    const commissionIdsToUpdate: string[] = [];
    for (const comm of sortedCommissions) {
        // Check if current commission's amount would push coveredAmount over requested_amount
        // If so, and we only want to cover up to requested_amount exactly, this logic would need adjustment.
        // For now, we assume we take full commissions until requested_amount is met or exceeded.
        if (coveredAmount >= requested_amount) break;
        
        commissionIdsToUpdate.push(comm.id);
        coveredAmount += comm.amount;
    }

    // Ensure we actually have enough from the selected commissions.
    // This check is somewhat redundant due to availableBalance check, but good for sanity.
    if (coveredAmount < requested_amount && commissionIdsToUpdate.length === (commissions?.length || 0) ) {
        // This case implies availableBalance check might have been based on slightly different set of commissions
        // or a race condition. For safety, rollback.
        console.error('Mismatch in available balance and commissions to update. Rolling back withdrawal.');
        await supabaseAdmin.from('withdrawal_requests').delete().eq('id', withdrawalRequest.id);
        return new Response(JSON.stringify({ error: 'Failed to accurately link commissions. Withdrawal cancelled.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 
        });
    }


    if (commissionIdsToUpdate.length > 0) {
        const { error: updateCommissionsError } = await supabaseAdmin
            .from('commissions')
            .update({ 
                status: 'processing_withdrawal', // New status to indicate it's part of a request
                withdrawal_request_id: withdrawalRequest.id 
            })
            .in('id', commissionIdsToUpdate);

        if (updateCommissionsError) {
            console.error('Error updating commissions for withdrawal request:', updateCommissionsError);
            // Critical: Rollback or flag the withdrawal request for manual review
            // For now, just log and return error.
             await supabaseAdmin.from('withdrawal_requests').delete().eq('id', withdrawalRequest.id); // Attempt rollback
            return new Response(JSON.stringify({ error: 'Failed to link commissions to withdrawal request.' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 
            });
        }
    }


    return new Response(JSON.stringify(withdrawalRequest), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    });

  } catch (error) {
    console.error('Error in request-withdrawal function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
