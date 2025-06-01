
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
// Pustaka QR Code (pastikan versi dan path impor sesuai)
import { QRCode } from "https://deno.land/x/qrcode@v2.0.0/mod.ts";
// Pustaka PDF Generation (pdf-lib melalui esm.sh)
import { PDFDocument, rgb, StandardFonts } from 'https://esm.sh/pdf-lib@1.17.1?pin=v135';

interface BookingRequestPayload {
  event_id: string;
  user_id?: string;
  num_tickets: number;
  selected_tier_name: string;
  coupon_code?: string;
  user_name: string;
  user_email: string;
  used_referral_code?: string;
}

function generateReferralCode(name: string): string {
  const namePart = name.substring(0, 3).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${namePart}${randomPart}`;
}

async function generateQRCodeDataURL(text: string): Promise<string | null> {
  try {
    const qrCodeDataURL = await QRCode.exportImage(text, { type: "image/png", quality: 0.9, margin: 1 });
    return qrCodeDataURL as string;
  } catch (error) {
    console.error("Error generating QR code:", error);
    return null;
  }
}

async function generateTicketPdf(bookingDetails: any, qrCodeDataUrl: string | null): Promise<Uint8Array | null> {
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 400]);
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    page.drawText(`E-TIKET ACARA`, {
      x: 50, y: height - 40, size: 20, font: boldFont, color: rgb(0.1, 0.1, 0.1),
    });
    page.drawText(bookingDetails.event_name, {
      x: 50, y: height - 65, size: 16, font: boldFont, color: rgb(0, 0.53, 0.71),
    });

    const eventDate = new Date(bookingDetails.event_date || Date.now()); // Asumsi event_date ada di bookingDetails
    page.drawText(`Tanggal: ${eventDate.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, { x: 50, y: height - 90, size: 10, font });
    page.drawText(`Lokasi: ${bookingDetails.event_location || 'N/A'}`, { x: 50, y: height - 105, size: 10, font });


    page.drawLine({
        start: { x: 50, y: height - 120 },
        end: { x: width - 50, y: height - 120 },
        thickness: 0.5,
        color: rgb(0.7, 0.7, 0.7),
    })

    page.drawText(`ID Pemesanan: ${bookingDetails.id.substring(0,13)}...`, { x: 50, y: height - 140, size: 10, font });
    page.drawText(`Nama Pemesan: ${bookingDetails.user_name}`, { x: 50, y: height - 155, size: 10, font });
    page.drawText(`Jumlah Tiket: ${bookingDetails.tickets} (${bookingDetails.selected_tier_name})`, { x: 50, y: height - 170, size: 10, font });
    page.drawText(`Total Bayar: Rp ${bookingDetails.total_price.toLocaleString('id-ID')}`, { x: 50, y: height - 185, size: 10, font: boldFont });

    if (qrCodeDataUrl) {
      const base64Data = qrCodeDataUrl.split(',')[1];
      if (base64Data) {
        const qrImageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        const qrImage = await pdfDoc.embedPng(qrImageBytes);
        const qrDims = qrImage.scale(0.35);
        page.drawImage(qrImage, {
          x: width - qrDims.width - 50,
          y: height - 100 - qrDims.height, // Sesuaikan posisi Y
          width: qrDims.width,
          height: qrDims.height,
        });
        page.drawText('Pindai untuk Check-in', { x: width - qrDims.width - 50, y: height - 110 - qrDims.height, size: 8, font, color: rgb(0.5,0.5,0.5) });
      }
    }
    
    page.drawText("Simpan e-tiket ini untuk ditunjukkan di pintu masuk. Dilarang menggandakan.", { x: 50, y: 40, size: 8, font, color: rgb(0.5, 0.5, 0.5) });
    page.drawText(`Bproid.com - ${new Date().getFullYear()}`, { x: 50, y: 25, size: 8, font, color: rgb(0.5, 0.5, 0.5) });


    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  } catch (error) {
    console.error("Error generating PDF:", error);
    return null;
  }
}

// (Konseptual) Fungsi untuk mengirim email
async function sendTicketEmail(to: string, subject: string, htmlBody: string, pdfAttachment?: { filename: string, content: Uint8Array, contentType: string }) {
  // Implementasi menggunakan layanan email Anda (Resend, SendGrid, dll.)
  // Contoh (pseudo-code, Anda perlu menggantinya dengan implementasi nyata):
  console.log(`Email to be sent to: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body: ${htmlBody.substring(0,100)}...`);
  if (pdfAttachment) {
    console.log(`Attachment: ${pdfAttachment.filename} (${pdfAttachment.content.byteLength} bytes)`);
  }
  // const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  // if (!RESEND_API_KEY) {
  //   console.error('RESEND_API_KEY is not set. Skipping email.');
  //   return;
  // }
  // const res = await fetch('https://api.resend.com/emails', {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'Authorization': `Bearer ${RESEND_API_KEY}`,
  //   },
  //   body: JSON.stringify({
  //     from: 'Bproid Support <noreply@yourdomain.com>', // Ganti dengan email pengirim Anda
  //     to: [to],
  //     subject: subject,
  //     html: htmlBody,
  //     attachments: pdfAttachment ? [{
  //         filename: pdfAttachment.filename,
  //         content: Buffer.from(pdfAttachment.content).toString('base64'), // Resend mungkin perlu base64
  //     }] : undefined,
  //   }),
  // });
  // if (!res.ok) {
  //   console.error('Failed to send email:', await res.text());
  // } else {
  //   console.log('Email sent successfully via Resend.');
  // }
}


Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload: BookingRequestPayload = await req.json();
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
      .select('id, name, price_tiers, available_tickets, date, location') // Tambah date, location
      .eq('id', event_id)
      .single();

    if (eventError || !event) {
      console.error('Event fetch error:', eventError);
      return new Response(JSON.stringify({ error: 'Acara tidak ditemukan.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404,
      });
    }

    if (event.available_tickets < num_tickets) {
      return new Response(JSON.stringify({ error: 'Tiket tidak cukup.' }), {
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
    let validCouponCode: string | null = null;

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
          validCouponCode = coupon.code;
        } else {
          console.warn(`Kupon ${coupon_code} tidak valid atau tidak memenuhi syarat.`);
        }
      } else {
        console.warn('Kupon tidak ditemukan atau error:', couponError);
      }
    }

    const bookingId = crypto.randomUUID();
    const buyerReferralCode = generateReferralCode(user_name);
    let ticketPdfUrl: string | null = null;

    const bookingPayloadDb = {
      id: bookingId, event_id: event.id, user_id: user_id || null,
      event_name: event.name, user_name: user_name, user_email: user_email,
      tickets: num_tickets, total_price: finalTotalPrice,
      booking_date: new Date().toISOString(), payment_status: 'pending',
      coupon_id: appliedCouponId, coupon_code: validCouponCode,
      discount_amount: discountAmount, selected_tier_name: selectedTier.name,
      selected_tier_price: tierPrice, used_referral_code: used_referral_code || null,
      buyer_referral_code: buyerReferralCode,
      ticket_pdf_url: null, // Awalnya null, akan diupdate setelah PDF disimpan
    };

    const { data: newBooking, error: bookingInsertError } = await supabaseAdmin
      .from('bookings')
      .insert(bookingPayloadDb)
      .select()
      .single();

    if (bookingInsertError) {
      console.error('Booking insert error:', bookingInsertError);
      return new Response(JSON.stringify({ error: 'Gagal membuat pemesanan.', details: bookingInsertError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
      });
    }

    // Setelah pemesanan berhasil, buat PDF dan QR Code
    // Gunakan data dari `event` dan `newBooking` untuk detail di PDF
    const qrCodeDataUrl = await generateQRCodeDataURL(`BookingID:${newBooking.id}`);
    const pdfTicketDetails = {
      ...newBooking, // Semua detail dari booking
      event_date: event.date, // Tambahkan info tambahan jika perlu
      event_location: event.location,
    };
    const pdfBytes = await generateTicketPdf(pdfTicketDetails, qrCodeDataUrl);

    if (pdfBytes) {
      const pdfFileName = `tickets/ticket_${newBooking.id}.pdf`;
      const { data: storageData, error: storageError } = await supabaseAdmin.storage
        .from('bproid-tickets') // Ganti dengan nama bucket Anda
        .upload(pdfFileName, pdfBytes, {
          contentType: 'application/pdf',
          cacheControl: '3600', // Opsional
          upsert: true, // Timpa jika sudah ada (seharusnya tidak terjadi untuk ID unik)
        });

      if (storageError) {
        console.error('Error uploading PDF to Supabase Storage:', storageError);
        // Lanjutkan tanpa URL PDF jika gagal unggah, tapi log error
      } else {
        const { data: publicUrlData } = supabaseAdmin.storage
          .from('bproid-tickets') // Ganti dengan nama bucket Anda
          .getPublicUrl(pdfFileName);
        
        if (publicUrlData && publicUrlData.publicUrl) {
          ticketPdfUrl = publicUrlData.publicUrl;
          // Update kolom ticket_pdf_url di tabel bookings
          const { error: updateBookingError } = await supabaseAdmin
            .from('bookings')
            .update({ ticket_pdf_url: ticketPdfUrl })
            .eq('id', newBooking.id);
          if (updateBookingError) {
            console.error('Error updating booking with PDF URL:', updateBookingError);
          }
        }
      }
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

    // TODO: Logika untuk menghitung dan mencatat komisi afiliasi jika used_referral_code ada

    // (Konseptual) Kirim Email jika pembayaran sudah 'paid'
    // Saat ini, status default adalah 'pending'. Pengiriman email tiket
    // idealnya terjadi setelah pembayaran dikonfirmasi.
    // Untuk contoh, kita bisa simulasikan pengiriman di sini jika diperlukan.
    if (newBooking.payment_status === 'paid' && ticketPdfUrl && pdfBytes) {
       await sendTicketEmail(
         newBooking.user_email,
         `E-Tiket Anda untuk ${newBooking.event_name}`,
         `<h1>Terima kasih!</h1><p>Berikut adalah e-tiket Anda untuk acara ${newBooking.event_name}.</p><p>Anda juga dapat mengunduhnya <a href="${ticketPdfUrl}">di sini</a>.</p>`,
         { filename: `tiket-${newBooking.id}.pdf`, content: pdfBytes, contentType: 'application/pdf' }
       );
    } else if (newBooking.payment_status === 'pending') {
        // Kirim email instruksi pembayaran jika diperlukan (meskipun halaman konfirmasi sudah ada)
        // await sendTicketEmail(
        //   newBooking.user_email,
        //   `Instruksi Pembayaran untuk ${newBooking.event_name}`,
        //   `<h1>Segera Selesaikan Pembayaran Anda</h1><p>Pemesanan Anda untuk ${newBooking.event_name} telah kami terima. Harap selesaikan pembayaran agar kami dapat mengirimkan e-tiket Anda.</p>`
        // );
        console.log(`Payment is pending for booking ${newBooking.id}. E-ticket PDF URL (if generated): ${ticketPdfUrl}`);
    }


    return new Response(
      JSON.stringify({
        message: 'Pemesanan berhasil dibuat!',
        bookingId: newBooking.id, eventName: event.name,
        totalPrice: finalTotalPrice, buyerReferralCode: buyerReferralCode,
        selectedTierName: selectedTier.name, numTickets: num_tickets,
        userName: user_name, userEmail: user_email,
        discountAmount: discountAmount, couponCode: validCouponCode,
        ticketPdfUrl: ticketPdfUrl, // Kirim URL PDF yang telah digenerate
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Unhandled error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Kesalahan internal server.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
    });
  }
});

    