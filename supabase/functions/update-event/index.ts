import { createClient, SupabaseClient } from 'supabase';
import { corsHeaders } from '../_shared/cors.ts';

interface EventTier {
  id?: string; // Optional for new tiers during update
  name: string;
  price: number;
  available_tickets: number;
}

interface UpdateEventPayload {
  event_id: string;
  name: string;
  description: string;
  date: string; // ISO string
  location: string;
  category: string;
  image_url?: string | null;
  tiers: EventTier[]; 
  // Add other fields that can be updated
}

async function isAdmin(supabase: SupabaseClient): Promise<boolean> {
  const { data: { user } , error } = await supabase.auth.getUser();
  if (error || !user) return false;
  const SUPER_ADMIN_UID = Deno.env.get('SUPER_ADMIN_UID');
  if (SUPER_ADMIN_UID && user.id === SUPER_ADMIN_UID) return true;
  const { data: userRole } = await supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
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
      console.error('Supabase env vars not set for update-event.');
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

    const payload: UpdateEventPayload = await req.json();
    const { event_id, name, description, date, location, category, image_url, tiers } = payload;

    if (!event_id || !name || !description || !date || !location || !category || !tiers || tiers.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid payload. Missing required event fields or tiers.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Update event details
    const { data: updatedEvent, error: eventUpdateError } = await supabaseAdmin
      .from('events')
      .update({
        name,
        description,
        date,
        location,
        category,
        image_url: image_url, // Handle null if image is removed
        // available_tickets will be sum of tiers, or managed separately if tiers are complex
      })
      .eq('id', event_id)
      .select()
      .single();

    if (eventUpdateError || !updatedEvent) {
      console.error('Error updating event:', eventUpdateError);
      return new Response(JSON.stringify({ error: 'Failed to update event details.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 
      });
    }

    // Handle Tiers: This can be complex.
    // Options: 1. Delete all existing tiers and recreate. 2. Upsert tiers.
    // For simplicity, let's try upserting. This requires tier IDs for existing tiers.
    // The payload should distinguish between new and existing tiers.
    // If tier IDs are not provided for existing tiers, this simple upsert might create duplicates or fail.
    // A robust solution would involve fetching existing tiers, diffing, and performing specific CUD operations.

    // For now, assuming tiers might be fully replaced or a simpler update model.
    // If tiers are stored in a separate 'event_tiers' table:
    // 1. Delete existing tiers for the event_id
    // await supabaseAdmin.from('event_tiers').delete().eq('event_id', event_id);
    // 2. Insert new tiers
    // const tierInsertPromises = tiers.map(tier => 
    //   supabaseAdmin.from('event_tiers').insert({ ...tier, event_id: event_id })
    // );
    // await Promise.all(tierInsertPromises);
    // This assumes `events.available_tickets` is a sum or needs manual update.

    // If tiers are a JSONB column in `events` table (as might be implied by current structure):
    const totalAvailableTickets = tiers.reduce((sum, tier) => sum + tier.available_tickets, 0);
    const { error: tierUpdateError } = await supabaseAdmin
        .from('events')
        .update({ tiers: tiers, available_tickets: totalAvailableTickets }) // Assuming 'tiers' is a JSONB column
        .eq('id', event_id);

    if (tierUpdateError) {
        console.error('Error updating event tiers:', tierUpdateError);
        // Potentially rollback event update or log inconsistency
        return new Response(JSON.stringify({ error: 'Event details updated, but failed to update tiers.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 
        });
    }
    
    // Re-fetch the event with updated tiers to return the full object
    const { data: finalEvent, error: finalFetchError } = await supabaseAdmin
        .from('events')
        .select('*')
        .eq('id', event_id)
        .single();


    return new Response(JSON.stringify({ message: 'Event updated successfully.', event: finalEvent || updatedEvent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 
    });

  } catch (error) {
    console.error('Error in update-event function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 
    });
  }
});
