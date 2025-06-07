import { createClient, SupabaseClient } from 'supabase';
import { corsHeaders } from '../_shared/cors.ts';

// Define UserRole directly to avoid path issues in Deno Edge Functions
type UserRole = 'admin' | 'affiliate' | 'customer';

interface DeactivateAffiliatePayload {
  user_id_to_deactivate: string;
}

// Helper function to check if user is admin (consistent with other functions)
async function isAdmin(supabase: SupabaseClient): Promise<boolean> {
  const { data: { user } , error } = await supabase.auth.getUser();
  if (error || !user) return false;
  
  // Check SUPER_ADMIN_UID first
  const SUPER_ADMIN_UID = Deno.env.get('SUPER_ADMIN_UID');
  if (SUPER_ADMIN_UID && user.id === SUPER_ADMIN_UID) {
    return true;
  }

  // Then check 'user_roles' table
  // This part assumes you have a 'user_roles' table linking users to roles.
  // If roles are directly in the 'users' table as an array, this needs adjustment.
  // Based on src/lib/types.ts User.roles is UserRole[], so we'll fetch from 'users' table.
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('roles')
    .eq('id', user.id)
    .single();

  if (userError || !userData || !userData.roles) return false;
  
  return (userData.roles as UserRole[]).includes('admin');
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

    // Create a Supabase client with the user's JWT to check their role
    const supabaseUserClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
    });

    const adminCheck = await isAdmin(supabaseUserClient);
    if (!adminCheck) {
      return new Response(JSON.stringify({ error: 'Unauthorized. Admin access required.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 
      });
    }

    // Proceed with admin-level client for modifications
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    const payload: DeactivateAffiliatePayload = await req.json();
    const { user_id_to_deactivate } = payload;

    if (!user_id_to_deactivate) {
      return new Response(JSON.stringify({ error: 'Invalid payload. user_id_to_deactivate is required.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 
      });
    }

    // Fetch the user to deactivate
    const { data: targetUser, error: fetchUserError } = await supabaseAdmin
      .from('users')
      .select('id, roles') // Fetch current roles
      .eq('id', user_id_to_deactivate)
      .single();

    if (fetchUserError || !targetUser) {
      console.error('Error fetching user to deactivate or user not found:', fetchUserError);
      return new Response(JSON.stringify({ error: 'Target user not found.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 
      });
    }

    let currentRoles = (targetUser.roles || []) as UserRole[];
    if (!currentRoles.includes('affiliate')) {
      return new Response(JSON.stringify({ message: 'User is not an active affiliate.', user_id: user_id_to_deactivate }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 
      });
    }

    // Remove 'affiliate' role
    const updatedRoles = currentRoles.filter(role => role !== 'affiliate');

    // Optional: Ensure 'customer' role if roles array becomes empty,
    // or if 'customer' is a default fallback role.
    // For now, just update with the filtered list. If empty, it's empty.
    // The frontend seems to handle empty roles by defaulting to 'Customer' display.

    const { error: updateUserError } = await supabaseAdmin
      .from('users')
      .update({ roles: updatedRoles })
      .eq('id', user_id_to_deactivate);

    if (updateUserError) {
      console.error('Error updating user roles:', updateUserError);
      return new Response(JSON.stringify({ error: 'Failed to deactivate affiliate status.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 
      });
    }

    return new Response(JSON.stringify({ message: 'User affiliate status successfully deactivated.', user_id: user_id_to_deactivate, new_roles: updatedRoles }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 
    });

  } catch (error: any) {
    console.error('Error in deactivate-affiliate function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error: ' + error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 
    });
  }
});
