
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { PDFDocument, rgb, StandardFonts } from 'https://esm.sh/pdf-lib@1.17.1?pin=v135';
import { QRCode } from "https://deno.land/x/qrcode@v2.0.0/mod.ts";

// Helper function to generate referral code (can be moved to _shared if used elsewhere)
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

async function generateTicketPdf(bookingDetails: any, eventDetails: any, qrCodeDataUrl: string | null): Promise<Uint8Array | null> {
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

    const eventDate = new Date(eventDetails.date || Date.now());
    page.drawText(`Tanggal: ${eventDate.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, { x: 50, y: height - 90, size: 10, font });
    page.drawText(`Lokasi: ${eventDetails.location || 'N/A'}`, { x: 50, y: height - 105, size: 10, font });

    page.drawLine({
        start: { x: 50, y: height - 120 },
        end: { x: width - 50, y: height - 120 },
        thickness: 0.5,
        color: rgb(0.7, 0.7, 0.7),
    });

    page.drawText(`ID Pemesanan: ${bookingDetails.id.substring(0,13)}...`, { x: 50, y: height - 140, size: 10, font });
    page.drawText(`Nama Pemesan: ${bookingDetails.user_name}`, { x: 50, y: height - 155, size: 10, font });
    page.drawText(`Email: ${bookingDetails.user_email}`, { x: 50, y: height - 170, size: 10, font });
    page.drawText(`Jumlah Tiket: ${bookingDetails.tickets} (${bookingDetails.selected_tier_name})`, { x: 50, y: height - 185, size: 10, font });
    page.drawText(`Total Bayar: Rp ${bookingDetails.total_price.toLocaleString('id-ID')}`, { x: 50, y: height - 200, size: 10, font: boldFont });

    if (qrCodeDataUrl) {
      const base64Data = qrCodeDataUrl.split(',')[1];
      if (base64Data) {
        const qrImageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        const qrImage = await pdfDoc.embedPng(qrImageBytes);
        const qrDims = qrImage.scale(0.35);
        page.drawImage(qrImage, {
          x: width - qrDims.width - 50,
          y: height - 100 - qrDims.height,
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

// CONCEPTUAL: Email sending function
async function sendTicketEmail(to: string, subject: string, htmlBody: string, pdfAttachment?: { filename: string, content: Uint8Array, contentType: string }) {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set in environment variables. Skipping email.');
    return;
  }
  console.log(`Attempting to send email to: ${to}`);
  
  // Convert Uint8Array to base64 string for Resend attachment
  const attachments = [];
  if (pdfAttachment && pdfAttachment.content) {
    let binary = '';
    const bytes = new Uint8Array(pdfAttachment.content);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    attachments.push({
        filename: pdfAttachment.filename,
        content: btoa(binary), // btoa for base64 encoding
    });
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: Deno.env.get('EMAIL_SENDER_FROM') || 'Bproid Tiket <noreply@yourdomain.com>', // Configure in Supabase Secrets
        to: [to],
        subject: subject,
        html: htmlBody,
        attachments: attachments.length > 0 ? attachments : undefined,
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error('Failed to send email via Resend:', res.status, errorBody);
    } else {
      console.log('Email sent successfully via Resend.');
    }
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

// Helper for Midtrans signature verification (conceptual)
async function verifyMidtransSignature(notificationPayload: any, serverKey: string): Promise<boolean> {
  // This is a simplified conceptual verification.
  // Midtrans provides specific guidance on how to verify signatures, often involving
  // concatenating order_id, status_code, gross_amount, and your server_key, then hashing (SHA512).
  // const { order_id, status_code, gross_amount, signature_key } = notificationPayload;
  // const stringToHash = `${order_id}${status_code}${gross_amount}${serverKey}`;
  //
  // const encoder = new TextEncoder();
  // const data = encoder.encode(stringToHash);
  // const hashBuffer = await crypto.subtle.digest('SHA-512', data);
  // const hashArray = Array.from(new Uint8Array(hashBuffer));
  // const calculatedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  //
  // return calculatedSignature === signature_key;
  console.warn("Midtrans signature verification is conceptual. Implement actual verification logic.");
  return true; // Placeholder - ALWAYS IMPLEMENT PROPER VERIFICATION
}


Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed. Use POST.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405,
    });
  }

  try {
    const notificationPayload = await req.json();
    console.log('Midtrans Webhook Received:', JSON.stringify(notificationPayload, null, 2));

    const supabaseAdmin: SupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    const MIDTRANS_SERVER_KEY = Deno.env.get('MIDTRANS_SERVER_KEY');
    if (!MIDTRANS_SERVER_KEY) {
        console.error("MIDTRANS_SERVER_KEY not configured for webhook.");
        return new Response(JSON.stringify({ error: 'Server configuration error.' }), { status: 500 });
    }

    // **SECURITY CRITICAL**: Verify the notification authenticity
    // const isSignatureValid = await verifyMidtransSignature(notificationPayload, MIDTRANS_SERVER_KEY);
    // if (!isSignatureValid) {
    //   console.error("Invalid Midtrans signature.");
    //   return new Response(JSON.stringify({ error: 'Invalid signature.' }), { status: 403 });
    // }

    const order_id = notificationPayload.order_id;
    const transaction_status = notificationPayload.transaction_status;
    const fraud_status = notificationPayload.fraud_status;

    let newPaymentStatus: 'pending' | 'paid' | 'failed' | 'expired' | 'cancelled' = 'pending';
    let sendTicket = false;

    if (transaction_status == 'capture') {
      if (fraud_status == 'accept') {
        newPaymentStatus = 'paid';
        sendTicket = true;
      } else if (fraud_status == 'challenge') {
        newPaymentStatus = 'pending'; // Or a specific 'review' status
        console.log(`Payment for order ${order_id} is under review by Midtrans.`);
      }
    } else if (transaction_status == 'settlement') {
      newPaymentStatus = 'paid';
      sendTicket = true;
    } else if (transaction_status == 'pending') {
      newPaymentStatus = 'pending';
    } else if (transaction_status == 'deny' || transaction_status == 'failure') {
      newPaymentStatus = 'failed';
    } else if (transaction_status == 'expire') {
      newPaymentStatus = 'expired';
    } else if (transaction_status == 'cancel') {
      newPaymentStatus = 'cancelled';
    }

    // Fetch the booking to get all necessary details
    const { data: booking, error: bookingFetchError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', order_id) // Assuming Midtrans order_id is our booking.id
      .single();

    if (bookingFetchError || !booking) {
      console.error(`Booking not found for order_id: ${order_id}`, bookingFetchError);
      return new Response(JSON.stringify({ error: 'Booking not found.' }), { status: 404 });
    }

    // Prevent re-processing if already paid (idempotency)
    if (booking.payment_status === 'paid' && newPaymentStatus === 'paid') {
        console.log(`Booking ${order_id} already marked as paid. Webhook likely a duplicate or status update.`);
        return new Response(JSON.stringify({ message: 'Webhook processed. Booking already paid.' }), { status: 200 });
    }
    
    const updatePayload: Partial<any> = { payment_status: newPaymentStatus };
    if (sendTicket && !booking.buyer_referral_code) { // Generate referral code only on first successful payment
        updatePayload.buyer_referral_code = generateReferralCode(booking.user_name);
    }


    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update(updatePayload)
      .eq('id', order_id);

    if (updateError) {
      console.error(`Failed to update booking status for ${order_id}:`, updateError);
      return new Response(JSON.stringify({ error: 'Failed to update booking status.' }), { status: 500 });
    }
    
    console.log(`Booking ${order_id} status updated to ${newPaymentStatus}.`);

    // If payment is successful, generate PDF, store it, and send email
    if (sendTicket) {
      // Fetch event details for PDF
      const { data: eventDetails, error: eventFetchErr } = await supabaseAdmin
        .from('events')
        .select('date, location, name') // Add other fields if needed for PDF
        .eq('id', booking.event_id)
        .single();

      if(eventFetchErr || !eventDetails) {
        console.error(`Failed to fetch event details for PDF (booking ${order_id}):`, eventFetchErr);
        // Proceed without PDF if event details can't be fetched, or handle error differently
      } else {
        const qrDataURL = await generateQRCodeDataURL(booking.id); // Use booking.id for QR
        const pdfBytes = await generateTicketPdf(booking, eventDetails, qrDataURL);

        if (pdfBytes) {
          const pdfFileName = `tickets/ticket_${booking.id}.pdf`;
          const { data: storageData, error: storageError } = await supabaseAdmin.storage
            .from('bproid-tickets') // Ensure this bucket exists and has correct policies
            .upload(pdfFileName, pdfBytes, {
              contentType: 'application/pdf', upsert: true,
            });

          if (storageError) {
            console.error(`Error uploading PDF for ${booking.id} to Storage:`, storageError);
          } else {
            const { data: publicUrlData } = supabaseAdmin.storage
              .from('bproid-tickets')
              .getPublicUrl(pdfFileName);
            
            if (publicUrlData && publicUrlData.publicUrl) {
              booking.ticket_pdf_url = publicUrlData.publicUrl;
              await supabaseAdmin.from('bookings').update({ ticket_pdf_url: booking.ticket_pdf_url }).eq('id', booking.id);

              // Send email with PDF
              await sendTicketEmail(
                booking.user_email,
                `E-Tiket Anda untuk ${booking.event_name}`,
                `<h1>Pembayaran Berhasil!</h1><p>Terima kasih telah melakukan pembayaran untuk acara ${booking.event_name}.</p><p>E-tiket Anda terlampir dalam email ini. Anda juga dapat mengunduhnya <a href="${booking.ticket_pdf_url}">di sini</a>.</p><p>Kode Referral Anda (jika ini pembelian pertama dan berhasil): ${updatePayload.buyer_referral_code || 'Akan segera dibuat'}</p>`,
                { filename: `tiket-${booking.id}.pdf`, content: pdfBytes, contentType: 'application/pdf' }
              );
            }
          }
        }
      }
      // Update coupon usage and event tickets if payment is successful
      if (booking.coupon_id) {
        const { error: couponUpdateError } = await supabaseAdmin
            .from('coupons')
            .update({ times_used: supabaseAdmin.sql`(times_used + 1)` as any })
            .eq('id', booking.coupon_id);
        if (couponUpdateError) console.error('Webhook: Coupon update error:', couponUpdateError);
      }

      const { error: eventTicketUpdateError } = await supabaseAdmin
          .from('events')
          .update({ available_tickets: supabaseAdmin.sql`(available_tickets - ${booking.tickets})` as any })
          .eq('id', booking.event_id);
      if (eventTicketUpdateError) console.error('Webhook: Event ticket update error:', eventTicketUpdateError);
      
      // TODO: Handle affiliate commission logic here
    }

    return new Response(JSON.stringify({ message: 'Webhook received and processed successfully.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    });

  } catch (error) {
    console.error('Error processing Midtrans webhook:', error);
    return new Response(JSON.stringify({ error: 'Internal server error processing webhook.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
    });
  }
});

// Deploy this function as `midtrans-webhook`
// Set MIDTRANS_SERVER_KEY and RESEND_API_KEY (or your email provider's key)
// and EMAIL_SENDER_FROM in Supabase Function environment variables/secrets.
