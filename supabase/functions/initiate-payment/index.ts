
// File: supabase/functions/initiate-payment/index.ts
// Menggantikan fungsi create-booking lama untuk memulai pembayaran.

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
// Untuk Midtrans, Anda mungkin perlu menggunakan `fetch` secara langsung atau pustaka HTTP client Deno
// Karena SDK Node.js Midtrans mungkin tidak langsung kompatibel.
// import midtransClient from 'midtrans-client'; // Ini untuk Node.js, perlu adaptasi untuk Deno

interface InitiatePaymentPayload {
  event_id: string;
  user_id?: string;
  num_tickets: number;
  selected_tier_name: string;
  coupon_code?: string;
  user_name: string;
  user_email: string;
  used_referral_code?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload: InitiatePaymentPayload = await req.json();
    const {
      event_id, user_id, num_tickets, selected_tier_name,
      coupon_code, user_name, user_email, used_referral_code,
    } = payload;

    const supabaseAdmin: SupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('id, name, price_tiers, available_tickets')
      .eq('id', event_id)
      .single();

    if (eventError || !event) {
      console.error('Event fetch error:', eventError);
      return new Response(JSON.stringify({ error: 'Acara tidak ditemukan.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404,
      });
    }

    if (event.available_tickets < num_tickets) {
      return new Response(JSON.stringify({ error: 'Tiket tidak cukup tersedia.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400,
      });
    }

    const selectedTier = event.price_tiers.find((tier: any) => tier.name === selected_tier_name);
    if (!selectedTier) {
      return new Response(JSON.stringify({ error: 'Jenis tiket tidak valid.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400,
      });
    }

    const tierPrice = selectedTier.price;
    let subtotalPrice = num_tickets * tierPrice;
    let finalTotalPrice = subtotalPrice;
    let discountAmount = 0;
    let appliedCouponId: string | null = null;
    let validCouponCodeFromDb: string | null = null;

    if (coupon_code) {
      const { data: coupon, error: couponError } = await supabaseAdmin
        .from('coupons')
        .select('id, code, discount_type, discount_value, expiry_date, is_active, usage_limit, times_used, min_purchase')
        .eq('code', coupon_code.toUpperCase())
        .single();

      if (coupon && !couponError) {
        const now = new Date();
        const expiryDate = new Date(coupon.expiry_date);
        if (coupon.is_active && expiryDate >= now && (!coupon.min_purchase || subtotalPrice >= coupon.min_purchase) && (!coupon.usage_limit || coupon.times_used < coupon.usage_limit)) {
          if (coupon.discount_type === 'percentage') {
            discountAmount = (subtotalPrice * coupon.discount_value) / 100;
          } else {
            discountAmount = coupon.discount_value;
          }
          discountAmount = Math.min(discountAmount, subtotalPrice);
          finalTotalPrice = subtotalPrice - discountAmount;
          appliedCouponId = coupon.id;
          validCouponCodeFromDb = coupon.code;
        }
      }
    }

    const bookingId = crypto.randomUUID();

    const initialBookingPayloadDb = {
      id: bookingId,
      event_id: event.id,
      user_id: user_id || null,
      event_name: event.name,
      user_name: user_name,
      user_email: user_email,
      tickets: num_tickets,
      total_price: finalTotalPrice,
      booking_date: new Date().toISOString(),
      payment_status: 'pending' as const,
      coupon_id: appliedCouponId,
      coupon_code: validCouponCodeFromDb,
      discount_amount: discountAmount,
      selected_tier_name: selectedTier.name,
      selected_tier_price: tierPrice,
      used_referral_code: used_referral_code || null,
      midtrans_order_id: bookingId,
      checked_in: false,
    };

    const { data: newBooking, error: bookingInsertError } = await supabaseAdmin
      .from('bookings')
      .insert(initialBookingPayloadDb)
      .select('id, total_price')
      .single();

    if (bookingInsertError) {
      console.error('Initial booking insert error:', bookingInsertError);
      return new Response(JSON.stringify({ error: 'Gagal membuat data pemesanan awal.', details: bookingInsertError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
      });
    }

    const MIDTRANS_SERVER_KEY = Deno.env.get('MIDTRANS_SERVER_KEY');
    // const MIDTRANS_CLIENT_KEY = Deno.env.get('NEXT_PUBLIC_MIDTRANS_CLIENT_KEY'); // Client Key akan digunakan di frontend
    const MIDTRANS_IS_PRODUCTION = Deno.env.get('MIDTRANS_IS_PRODUCTION') === 'true';

    if (!MIDTRANS_SERVER_KEY) {
        console.error("Midtrans Server Key is not configured.");
        return new Response(JSON.stringify({ error: "Konfigurasi server pembayaran tidak lengkap." }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
        });
    }
    
    const midtransApiUrl = MIDTRANS_IS_PRODUCTION 
      ? 'https://api.midtrans.com/snap/v1/transactions' 
      : 'https://api.sandbox.midtrans.com/snap/v1/transactions';
    
    const midtransAuthString = btoa(`${MIDTRANS_SERVER_KEY}:`);

    const midtransParams = {
      transaction_details: {
        order_id: newBooking.id,
        gross_amount: newBooking.total_price,
      },
      customer_details: {
        first_name: user_name,
        email: user_email,
      },
      // Anda bisa menambahkan item_details, expiry, enabled_payments, dll. di sini
    };

    let midtransToken: string | null = null;
    
    try {
      const response = await fetch(midtransApiUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Basic ${midtransAuthString}`
        },
        body: JSON.stringify(midtransParams)
      });
      
      const midtransResponseData = await response.json();

      if (!response.ok || midtransResponseData.error_messages || !midtransResponseData.token) {
        console.error("Midtrans API error:", midtransResponseData);
        const errorMessages = midtransResponseData.error_messages ? midtransResponseData.error_messages.join(", ") : "Failed to create Midtrans transaction";
        // Rollback or mark booking as failed if Midtrans fails
        await supabaseAdmin.from('bookings').update({ payment_status: 'failed' }).eq('id', newBooking.id);
        return new Response(JSON.stringify({ error: 'Gagal membuat transaksi pembayaran dengan Midtrans.', details: errorMessages }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
        });
      }
      midtransToken = midtransResponseData.token;

    } catch (midtransError) {
       console.error("Error creating Midtrans transaction:", midtransError);
       await supabaseAdmin.from('bookings').update({ payment_status: 'failed' }).eq('id', newBooking.id);
       return new Response(JSON.stringify({ error: 'Gagal menghubungi server pembayaran.', details: midtransError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
      });
    }

    const { error: updateBookingWithMidtransTokenError } = await supabaseAdmin
      .from('bookings')
      .update({ midtrans_token: midtransToken })
      .eq('id', newBooking.id);

    if (updateBookingWithMidtransTokenError) {
      console.error("Error updating booking with Midtrans token:", updateBookingWithMidtransTokenError);
      // Non-critical for client, but log it.
    }

    return new Response(
      JSON.stringify({
        message: 'Payment initiation successful!',
        booking_id: newBooking.id,
        midtrans_token: midtransToken,
        total_price: newBooking.total_price
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Unhandled error in initiate-payment:', error);
    return new Response(JSON.stringify({ error: error.message || 'Kesalahan internal server.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
    });
  }
});
