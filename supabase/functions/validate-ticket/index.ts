
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface ValidateTicketPayload {
  bookingId: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  // Pastikan hanya admin yang bisa mengakses, atau service_role jika dipanggil dari backend lain
  // Untuk keamanan, sebaiknya validasi JWT admin di sini jika dipanggil langsung dari frontend admin.
  // Contoh:
  // const authHeader = req.headers.get('Authorization');
  // if (!authHeader) return new Response(JSON.stringify({ error: 'Missing auth header' }), { status: 401 });
  // const token = authHeader.replace('Bearer ', '');
  // const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
  // if (userError || !user) return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
  // Check if user is admin based on your roles system.

  try {
    const { bookingId }: ValidateTicketPayload = await req.json();

    if (!bookingId) {
      return new Response(JSON.stringify({ error: 'Booking ID is required.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400,
      });
    }

    const supabaseAdmin: SupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: booking, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('*') // Ambil semua field untuk ditampilkan di admin
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      console.error('Error fetching booking or booking not found:', fetchError);
      return new Response(JSON.stringify({ error: 'Tiket tidak ditemukan atau tidak valid.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404,
      });
    }

    if (booking.payment_status !== 'paid') {
      return new Response(JSON.stringify({ 
        error: `Pembayaran tiket belum lunas (Status: ${booking.payment_status}).`,
        booking_details: booking,
        status_code: 'PAYMENT_NOT_CONFIRMED'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 402, // Payment Required
      });
    }

    if (booking.checked_in) {
      return new Response(JSON.stringify({ 
        error: `Tiket ini sudah digunakan (Check-in pada: ${booking.checked_in_at ? new Date(booking.checked_in_at).toLocaleString('id-ID') : 'N/A'}).`,
        booking_details: booking,
        status_code: 'ALREADY_CHECKED_IN'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409, // Conflict
      });
    }

    // Jika semua validasi lolos, tiket valid untuk check-in
    // Sekarang, kita bisa update status check-in jika ada aksi 'check-in'
    if (req.method === 'POST' && req.url.includes('?action=check-in')) { // Contoh jika ada parameter action
        const { error: updateError } = await supabaseAdmin
            .from('bookings')
            .update({ checked_in: true, checked_in_at: new Date().toISOString() })
            .eq('id', booking.id);

        if (updateError) {
            console.error('Error updating check-in status:', updateError);
            return new Response(JSON.stringify({ error: 'Gagal melakukan check-in tiket.', details: updateError.message }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
            });
        }
        // Ambil ulang data booking setelah update
        const { data: updatedBooking } = await supabaseAdmin.from('bookings').select('*').eq('id', bookingId).single();
        return new Response(JSON.stringify({ 
            message: 'Tiket berhasil di check-in!',
            booking_details: updatedBooking,
            status_code: 'CHECK_IN_SUCCESSFUL'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
        });
    }


    return new Response(JSON.stringify({ 
      message: 'Tiket valid dan siap untuk check-in.',
      booking_details: booking,
      status_code: 'VALID_FOR_CHECK_IN'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    });

  } catch (error) {
    console.error('Unhandled error in validate-ticket:', error);
    return new Response(JSON.stringify({ error: 'Kesalahan internal server saat validasi tiket.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
    });
  }
});
