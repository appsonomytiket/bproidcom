import { createClient, SupabaseClient } from 'supabase';
import { corsHeaders } from '../_shared/cors.ts';

interface ValidateTicketPayload {
  booking_id: string;
}

// Helper function to check if user is admin (consistent with other admin functions)
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

  if (userFetchError || !userData || !userData.roles) {
    // Log error if needed, or handle if user not found in 'users' table but exists in 'auth.users'
    return false;
  }
  
  // Assuming UserRole is 'admin' | 'affiliate' | 'customer'
  // This requires UserRole type to be available or defined if strict typing is needed here.
  // For simplicity, casting to any[] or string[] if UserRole type is not imported/defined.
  return (userData.roles as string[]).includes('admin');
}

// Define the main request handler function
export const ticketValidationHandler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey || !supabaseAnonKey) {
      console.error('Supabase environment variables not set for validate-ticket.');
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

    const payload: ValidateTicketPayload = await req.json();
    const { booking_id } = payload;

    if (!booking_id) {
      return new Response(JSON.stringify({ error: 'Invalid payload. booking_id is required.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Fetch the booking
    const { data: booking, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('id, payment_status, checked_in, event_id, user_id, user_name, event_name, selected_tier_name, tickets') // Include details to return
      .eq('id', booking_id)
      .single();

    if (fetchError || !booking) {
      console.error('Error fetching booking or not found:', fetchError);
      return new Response(JSON.stringify({ 
        status: 'not_found', 
        message: 'Booking ID not found.',
        booking_details: null 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 
      });
    }

    if (booking.payment_status !== 'paid') {
      return new Response(JSON.stringify({ 
        status: 'not_paid', 
        message: `Ticket not paid. Payment status: ${booking.payment_status}.`,
        booking_details: booking 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 
      });
    }

    if (booking.checked_in) {
      return new Response(JSON.stringify({ 
        status: 'already_checked_in', 
        message: 'This ticket has already been checked in.',
        booking_details: booking
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 
      });
    }

    // If valid, not paid, and not checked-in, proceed to check-in
    const now = new Date().toISOString();
    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({ checked_in: true, checked_in_at: now })
      .eq('id', booking_id);

    if (updateError) {
      console.error('Error updating booking for check-in:', updateError);
      return new Response(JSON.stringify({ 
        status: 'update_failed', 
        message: 'Failed to update booking for check-in.',
        booking_details: booking
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 
      });
    }
    
    // Fetch the updated booking details to return
     const { data: updatedBooking, error: fetchUpdatedError } = await supabaseAdmin
      .from('bookings')
      .select('id, payment_status, checked_in, checked_in_at, event_id, user_id, user_name, event_name, selected_tier_name, tickets')
      .eq('id', booking_id)
      .single();

    return new Response(JSON.stringify({ 
      status: 'success', 
      message: 'Ticket successfully validated and checked in.',
      booking_details: updatedBooking || booking // Fallback to booking if fetch fails, though unlikely
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 
    });

  } catch (error) {
    console.error('Error in validate-ticket function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 
    });
  }
};

// Serve the handler
Deno.serve(ticketValidationHandler);
