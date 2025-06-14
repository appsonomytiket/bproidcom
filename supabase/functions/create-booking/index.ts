
// This function is now repurposed to INITIATE a booking and payment with Midtrans
// It will NOT finalize the booking or send tickets directly.
// That will be handled by the midtrans-webhook function.

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
// Midtrans client library (conceptual - you'd use the actual Midtrans SDK or HTTP calls)
// For Deno, you might need to fetch or use a Deno-compatible library.
// import midtransClient from 'https://esm.sh/midtrans-client'; // Example, might not work directly in Deno

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

    // 1. Fetch event details
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

    // 2. Validate coupon (server-side)
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

    // 3. Create an initial booking record with 'pending' status
    const bookingId = crypto.randomUUID(); // This will be our Midtrans order_id

    const initialBookingPayload = {
      id: bookingId,
      event_id: event.id,
      user_id: user_id || null,
      event_name: event.name,
      user_name: user_name,
      user_email: user_email,
      tickets: num_tickets,
      total_price: finalTotalPrice, // Final price after potential coupon
      booking_date: new Date().toISOString(),
      payment_status: 'pending', // IMPORTANT
      coupon_id: appliedCouponId,
      coupon_code: validCouponCodeFromDb,
      discount_amount: discountAmount,
      selected_tier_name: selectedTier.name,
      selected_tier_price: tierPrice,
      used_referral_code: used_referral_code || null,
      // buyer_referral_code will be generated after successful payment by webhook
      midtrans_order_id: bookingId, // Store our bookingId as Midtrans order_id
      checked_in: false,
    };

    const { data: newBooking, error: bookingInsertError } = await supabaseAdmin
      .from('bookings')
      .insert(initialBookingPayload)
      .select('id, total_price') // Select only what's needed for Midtrans
      .single();

    if (bookingInsertError) {
      console.error('Initial booking insert error:', bookingInsertError);
      return new Response(JSON.stringify({ error: 'Gagal membuat data pemesanan awal.', details: bookingInsertError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
      });
    }

    // 4. CONCEPTUAL: Create Midtrans Transaction
    // In a real scenario, you would use Midtrans's SDK or make an HTTP request to their API.
    // Ensure Midtrans Server Key and Client Key are set as environment variables in Supabase Function settings.
    const MIDTRANS_SERVER_KEY = Deno.env.get('MIDTRANS_SERVER_KEY');
    const MIDTRANS_CLIENT_KEY = Deno.env.get('NEXT_PUBLIC_MIDTRANS_CLIENT_KEY'); // Client key for Snap.js, can also be from env
    const MIDTRANS_IS_PRODUCTION = Deno.env.get('MIDTRANS_IS_PRODUCTION') === 'true';

    if (!MIDTRANS_SERVER_KEY || !MIDTRANS_CLIENT_KEY) {
        console.error("Midtrans keys are not configured in environment variables.");
        return new Response(JSON.stringify({ error: "Konfigurasi pembayaran tidak lengkap." }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
        });
    }
    
    // Example Midtrans parameter (adjust based on Midtrans API documentation)
    const midtransParams = {
      transaction_details: {
        order_id: newBooking.id, // Use your unique booking ID
        gross_amount: newBooking.total_price, // Use the final calculated price
      },
      customer_details: {
        first_name: user_name,
        email: user_email,
        // phone: "YOUR_CUSTOMER_PHONE" // Optional
      },
      // item_details: [ // Optional
      //   {
      //     id: event.id,
      //     price: selectedTier.price,
      //     quantity: num_tickets,
      //     name: `${event.name} - ${selectedTier.name}`
      //   }
      // ],
      // expiry: { // Optional: Set transaction expiry
      //   start_time: new Date().toISOString().replace(/\\.\\d{3}Z$/, "+0700"), // Current time in "YYYY-MM-DD HH:mm:ss Z"
      //   unit: "minutes",
      //   duration: 60
      // },
      // enabled_payments: ["credit_card", "gopay", "shopeepay", "bca_va", "bni_va", "bri_va"] // Optional
    };

    // CONCEPTUAL: Midtrans API call to create transaction
    // const midtransApiUrl = MIDTRANS_IS_PRODUCTION 
    //   ? 'https://api.midtrans.com/snap/v1/transactions' 
    //   : 'https://api.sandbox.midtrans.com/snap/v1/transactions';

    // const midtransAuthString = btoa(`${MIDTRANS_SERVER_KEY}:`); // Basic Auth: ServerKey as username, empty password
    
    let midtransToken: string | null = null;
    let midtransRedirectUrl: string | null = null;

    try {
      // This is a conceptual representation. Replace with actual Midtrans SDK or HTTP call.
      // Using a dummy response for now.
      // const response = await fetch(midtransApiUrl, {
      //   method: 'POST',
      //   headers: {
      //     'Accept': 'application/json',
      //     'Content-Type': 'application/json',
      //     'Authorization': `Basic ${midtransAuthString}`
      //   },
      //   body: JSON.stringify(midtransParams)
      // });
      // const midtransResponseData = await response.json();
      // if (!response.ok || midtransResponseData.error_messages) {
      //   console.error("Midtrans API error:", midtransResponseData);
      //   throw new Error(midtransResponseData.error_messages ? midtransResponseData.error_messages.join(", ") : "Failed to create Midtrans transaction");
      // }
      // midtransToken = midtransResponseData.token;
      // midtransRedirectUrl = midtransResponseData.redirect_url;
      
      // DUMMY TOKEN FOR TESTING (Remove in production)
      midtransToken = `dummy-midtrans-token-${newBooking.id}-${Date.now()}`;
      console.warn("USING DUMMY MIDTRANS TOKEN. REPLACE WITH ACTUAL MIDTRANS INTEGRATION.");
      
      if (!midtransToken) {
         throw new Error("Midtrans token not received.");
      }

    } catch (midtransError) {
       console.error("Error creating Midtrans transaction:", midtransError);
       // Optionally, update booking status to 'failed' here or mark it for cleanup
       return new Response(JSON.stringify({ error: 'Gagal membuat transaksi pembayaran.', details: midtransError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
      });
    }

    // Store Midtrans token in booking if needed (optional)
    const { error: updateBookingWithMidtransError } = await supabaseAdmin
      .from('bookings')
      .update({ midtrans_token: midtransToken })
      .eq('id', newBooking.id);

    if (updateBookingWithMidtransError) {
      console.error("Error updating booking with Midtrans token:", updateBookingWithMidtransError);
      // Non-critical, proceed with returning token to client
    }

    // 5. Return Midtrans token or redirect_url to frontend
    return new Response(
      JSON.stringify({
        message: 'Payment initiation successful!',
        booking_id: newBooking.id,
        midtrans_token: midtransToken, // For Snap.js
        midtrans_redirect_url: midtransRedirectUrl, // If using redirect flow
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
// Rename this file to `initiate-payment/index.ts` and deploy it.
// The old `create-booking` logic for PDF and email is now conceptually moved to `midtrans-webhook`.
