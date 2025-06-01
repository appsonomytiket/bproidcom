
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts'; // Kita akan buat file ini

// Definisikan tipe data yang diharapkan dari frontend
interface BookingRequestPayload {
  event_id: string;
  user_id?: string; // Opsional, untuk pengguna yang login
  num_tickets: number;
  selected_tier_name: string;
  coupon_code?: string;
  user_name: string; // Untuk tamu atau pengguna yang login
  user_email: string; // Untuk tamu atau pengguna yang login
  used_referral_code?: string;
}

// Fungsi untuk menghasilkan kode referral sederhana
function generateReferralCode(name: string): string {
  const namePart = name.substring(0, 3).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${namePart}${randomPart}`;
}

Deno.serve(async (req) => {
  // Handle preflight OPTIONS request untuk CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload: BookingRequestPayload = await req.json();
    const {
      event_id,
      user_id,
      num_tickets,
      selected_tier_name,
      coupon_code,
      user_name,
      user_email,
      used_referral_code,
    } = payload;

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!, 
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! 
    );
    
    // 1. Ambil dan validasi detail acara
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('id, name, price_tiers, available_tickets, category, date, location, organizer')
      .eq('id', event_id)
      .single();

    if (eventError || !event) {
      console.error('Event fetch error:', eventError);
      return new Response(JSON.stringify({ error: 'Acara tidak ditemukan atau terjadi kesalahan.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    if (event.available_tickets < num_tickets) {
      return new Response(JSON.stringify({ error: 'Tiket tidak cukup tersedia.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const selectedTier = event.price_tiers.find(
      (tier: any) => tier.name === selected_tier_name
    );

    if (!selectedTier) {
      return new Response(JSON.stringify({ error: 'Jenis tiket tidak valid.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    const tierPrice = selectedTier.price;
    let subtotalPrice = num_tickets * tierPrice;
    let finalTotalPrice = subtotalPrice;
    let discountAmount = 0;
    let appliedCouponId: string | null = null;

    // 2. Validasi kupon (jika ada)
    if (coupon_code) {
      const { data: coupon, error: couponError } = await supabaseAdmin
        .from('coupons')
        .select('id, code, discount_type, discount_value, expiry_date, is_active, usage_limit, times_used, min_purchase')
        .eq('code', coupon_code.toUpperCase())
        .single();

      if (couponError || !coupon) {
        console.warn('Coupon not found or error:', couponError);
      } else {
        const now = new Date();
        const expiryDate = new Date(coupon.expiry_date);
        if (!coupon.is_active) console.warn(`Kupon ${coupon_code} tidak aktif.`);
        else if (expiryDate < now) console.warn(`Kupon ${coupon_code} sudah kedaluwarsa.`);
        else if (coupon.min_purchase && subtotalPrice < coupon.min_purchase) console.warn(`Minimal pembelian untuk kupon ${coupon_code} tidak terpenuhi.`);
        else if (coupon.usage_limit && coupon.times_used >= coupon.usage_limit) console.warn(`Kupon ${coupon_code} telah mencapai batas penggunaan.`);
        else {
          if (coupon.discount_type === 'percentage') {
            discountAmount = (subtotalPrice * coupon.discount_value) / 100;
          } else {
            discountAmount = coupon.discount_value;
          }
          discountAmount = Math.min(discountAmount, subtotalPrice);
          finalTotalPrice = subtotalPrice - discountAmount;
          appliedCouponId = coupon.id;
        }
      }
    }
    
    const bookingId = crypto.randomUUID();
    const buyerReferralCode = generateReferralCode(user_name);
    
    // --- Placeholder untuk URL PDF Tiket ---
    // Dalam implementasi nyata, URL ini akan berasal dari hasil penyimpanan PDF yang digenerate.
    // Misalnya, setelah PDF diunggah ke Supabase Storage.
    const ticketPdfUrl = null; // Atau "https://your-storage-url/ticket-${bookingId}.pdf" jika sudah ada

    const bookingPayload = {
      id: bookingId,
      event_id: event.id,
      user_id: user_id || null,
      event_name: event.name,
      user_name: user_name,
      user_email: user_email,
      tickets: num_tickets,
      total_price: finalTotalPrice,
      booking_date: new Date().toISOString(),
      payment_status: 'pending',
      coupon_id: appliedCouponId,
      coupon_code: appliedCouponId ? coupon_code?.toUpperCase() : null,
      discount_amount: discountAmount,
      selected_tier_name: selectedTier.name,
      selected_tier_price: tierPrice,
      used_referral_code: used_referral_code || null,
      buyer_referral_code: buyerReferralCode,
      ticket_pdf_url: ticketPdfUrl, // Menyimpan URL PDF (atau null jika belum ada)
    };

    const { data: newBooking, error: bookingInsertError } = await supabaseAdmin
      .from('bookings')
      .insert(bookingPayload)
      .select()
      .single();

    if (bookingInsertError) {
      console.error('Booking insert error:', bookingInsertError);
      return new Response(JSON.stringify({ error: 'Gagal membuat pemesanan.', details: bookingInsertError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    if (appliedCouponId) {
      const { error: couponUpdateError } = await supabaseAdmin
        .from('coupons')
        .update({ times_used: supabaseAdmin.sql`(times_used + 1)` as any })
        .eq('id', appliedCouponId);
      if (couponUpdateError) console.error('Coupon update error:', couponUpdateError);
    }

    const { error: eventTicketUpdateError } = await supabaseAdmin
      .from('events')
      .update({ available_tickets: supabaseAdmin.sql`(available_tickets - ${num_tickets})` as any })
      .eq('id', event.id);
    if (eventTicketUpdateError) console.error('Event ticket update error:', eventTicketUpdateError);
    
    // --- LOGIKA PEMBUATAN PDF DAN PENGIRIMAN EMAIL AKAN DI SINI ---
    // 1. Generate PDF Tiket:
    //    - Gunakan pustaka Deno untuk membuat PDF (misalnya, pdf-lib, deno-pdf).
    //    - Sertakan detail pesanan (nama acara, nama pemesan, jumlah tiket, tier, QR code bookingId).
    //    - Untuk QR code, Anda mungkin perlu pustaka QR code generator atau API eksternal.
    //    - Contoh: const pdfBytes = await generateTicketPdf(newBooking);

    // 2. Simpan PDF (opsional, jika ingin link permanen):
    //    - Unggah pdfBytes ke Supabase Storage.
    //    - Dapatkan URL publik dari PDF yang diunggah.
    //    - Update kolom `ticket_pdf_url` di tabel `bookings` dengan URL ini.
    //    - Contoh: const { data: storageData, error: storageError } = await supabaseAdmin.storage.from('tickets').upload(`public/${bookingId}.pdf`, pdfBytes, { contentType: 'application/pdf' });
    //    - if (storageData) { /* update booking dengan storageData.path */ }


    // 3. Kirim Email dengan Tiket PDF:
    //    - Gunakan layanan email pihak ketiga (SendGrid, Resend, dll.) melalui API mereka.
    //    - Lampirkan PDF yang digenerate (pdfBytes) atau sertakan link ke PDF.
    //    - Contoh (pseudo-code): await sendEmail({ to: user_email, subject: `Tiket Anda untuk ${event.name}`, body: "...", attachments: [{filename: 'ticket.pdf', content: pdfBytes}] });
    //    - Jika status pembayaran 'paid', maka kirim email. Jika 'pending', instruksi pembayaran dikirim (sudah ada di halaman konfirmasi).
    //    - Halaman konfirmasi sudah memberikan instruksi pembayaran. Pengiriman e-tiket PDF biasanya dilakukan SETELAH pembayaran dikonfirmasi.
    //    - Logika ini mungkin lebih baik dipicu oleh webhook setelah pembayaran berhasil, atau oleh admin secara manual.

    console.log(`Pemesanan ${newBooking.id} berhasil. PDF URL (placeholder): ${newBooking.ticket_pdf_url}`);

    return new Response(
      JSON.stringify({ 
        message: 'Pemesanan berhasil dibuat!', 
        booking: newBooking,
        bookingId: newBooking.id,
        eventName: event.name,
        totalPrice: finalTotalPrice,
        buyerReferralCode: buyerReferralCode,
        selectedTierName: selectedTier.name,
        numTickets: num_tickets,
        userName: user_name,
        userEmail: user_email,
        discountAmount: discountAmount,
        couponCode: appliedCouponId ? coupon_code?.toUpperCase() : undefined,
        ticketPdfUrl: newBooking.ticket_pdf_url, // Kirim URL PDF (saat ini null)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Unhandled error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Terjadi kesalahan internal.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
