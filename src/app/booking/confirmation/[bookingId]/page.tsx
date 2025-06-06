
"use client";

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation'; // Ditambahkan useSearchParams
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { CheckCircle, ClipboardCopy, Download, Ticket, Percent, Loader2, AlertTriangle, MailCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BookingDetailsStorage {
  bookingId: string;
  eventName: string;
  name: string;
  email: string;
  tickets: number;
  totalPrice: number;
  buyerReferralCode?: string; 
  selectedTierName?: string;
  selectedTierPrice?: number;
  couponCode?: string; 
  discountAmount?: number;
  paymentStatus?: 'paid' | 'pending' | 'failed'; // Ditambahkan paymentStatus
}

export default function BookingConfirmationPage() {
  const params = useParams();
  const searchParams = useSearchParams(); // Untuk mengambil status dari URL
  const { bookingId } = params;
  const [details, setDetails] = useState<BookingDetailsStorage | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const paymentStatusFromUrl = searchParams.get('status') as BookingDetailsStorage['paymentStatus'];

  useEffect(() => {
    setLoading(true);
    if (typeof window !== 'undefined' && bookingId) {
      const storedDetailsString = localStorage.getItem('bookingDetails');
      if (storedDetailsString) {
        try {
          const parsedDetails: BookingDetailsStorage = JSON.parse(storedDetailsString);
          
          if (parsedDetails.bookingId === bookingId) {
            // Update payment status from URL if available and different
            if (paymentStatusFromUrl && paymentStatusFromUrl !== parsedDetails.paymentStatus) {
                parsedDetails.paymentStatus = paymentStatusFromUrl;
                localStorage.setItem('bookingDetails', JSON.stringify(parsedDetails)); // Update localStorage
            }
            setDetails(parsedDetails);
          } else {
            console.warn("Booking ID mismatch between URL and localStorage.");
            // Set to minimal error data or try fetching from server if implemented
            setDetails({ 
              bookingId: bookingId as string, eventName: "Detail Pemesanan Tidak Cocok",
              name: "N/A", email: "N/A", tickets: 0, totalPrice: 0,
              paymentStatus: paymentStatusFromUrl || 'pending'
            });
          }
        } catch (e) {
          console.error("Gagal mem-parse bookingDetails dari localStorage:", e);
           setDetails({
              bookingId: bookingId as string, eventName: "Kesalahan Data Pemesanan",
              name: "N/A", email: "N/A", tickets: 0, totalPrice: 0,
              paymentStatus: paymentStatusFromUrl || 'pending'
            });
        }
      } else {
         setDetails({
            bookingId: bookingId as string, eventName: "Detail Pemesanan Tidak Ditemukan",
            name: "N/A", email: "N/A", tickets: 0, totalPrice: 0,
            paymentStatus: paymentStatusFromUrl || 'pending'
          });
      }
    }
    setLoading(false);
  }, [bookingId, paymentStatusFromUrl]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: `${label} Disalin!`, description: `${text} telah disalin ke clipboard Anda.` });
    }).catch(err => {
      toast({ title: "Penyalinan Gagal", description: `Tidak dapat menyalin ${label}.`, variant: "destructive" });
    });
  };
  
  if (loading || !details) {
    return (
      <div className="container flex min-h-[calc(100vh-10rem)] items-center justify-center py-12 text-center">
        <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
        <p className="text-xl font-semibold">Memuat detail pemesanan...</p>
      </div>
    );
  }
  
  const originalPriceBeforeDiscount = (details.totalPrice || 0) + (details.discountAmount || 0);

  let statusTitle = "Pemesanan Diterima";
  let statusDescription = `Pemesanan Anda untuk ${details.eventName} telah kami terima.`;
  let statusIcon = <MailCheck className="h-10 w-10" />;
  let cardHeaderClass = "bg-blue-600 text-white"; // Default for pending/processing

  if (details.paymentStatus === 'paid') {
    statusTitle = "Pembayaran Berhasil!";
    statusDescription = `E-tiket Anda untuk ${details.eventName} akan segera dikirimkan ke email Anda.`;
    statusIcon = <CheckCircle className="h-10 w-10" />;
    cardHeaderClass = "bg-green-600 text-white";
  } else if (details.paymentStatus === 'pending') {
    statusTitle = "Pembayaran Tertunda";
    statusDescription = `Selesaikan pembayaran Anda. Instruksi lebih lanjut mungkin telah dikirimkan ke email Anda.`;
    statusIcon = <Loader2 className="h-10 w-10 animate-spin" />;
    cardHeaderClass = "bg-yellow-500 text-black";
  } else if (details.paymentStatus === 'failed') {
    statusTitle = "Pembayaran Gagal";
    statusDescription = `Pembayaran untuk pesanan ${details.eventName} gagal. Silakan coba lagi.`;
    statusIcon = <AlertTriangle className="h-10 w-10" />;
    cardHeaderClass = "bg-red-600 text-white";
  }


  return (
    <div className="container py-12">
      <Card className="mx-auto max-w-2xl shadow-xl">
        <CardHeader className={`${cardHeaderClass} p-6 rounded-t-lg`}>
          <div className="flex items-center gap-3">
            {statusIcon}
            <div>
              <CardTitle className="text-3xl font-bold">{statusTitle}</CardTitle>
              <CardDescription className={`${details.paymentStatus === 'pending' ? 'text-black/80' : 'text-white/80'}`}>{statusDescription}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">ID Pemesanan: {details.bookingId}</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li><strong>Nama:</strong> {details.name}</li>
              <li><strong>Email:</strong> {details.email}</li>
              <li><strong>Acara:</strong> {details.eventName}</li>
              {details.selectedTierName && details.selectedTierName !== "N/A" && (
                <li><strong>Jenis Tiket:</strong> {details.selectedTierName} (Rp {details.selectedTierPrice?.toLocaleString()})</li>
              )}
              <li><strong>Jumlah Tiket:</strong> {details.tickets}</li>
              {details.couponCode && details.discountAmount && details.discountAmount > 0 && (
                <>
                  <li><strong>Subtotal:</strong> Rp {originalPriceBeforeDiscount.toLocaleString()}</li>
                  <li className="text-green-600">
                    <strong>Kupon ({details.couponCode}):</strong> - Rp {details.discountAmount.toLocaleString()}
                  </li>
                </>
              )}
              <li className="font-semibold text-foreground"><strong>Total Tagihan:</strong> Rp {details.totalPrice.toLocaleString()}</li>
            </ul>
          </div>

          {details.paymentStatus === 'paid' && details.buyerReferralCode && details.buyerReferralCode !== "N/A" && (
             <div>
              <h3 className="text-lg font-semibold mb-1">Kode Referral Anda:</h3>
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold text-accent p-2 border border-dashed border-accent rounded-md">
                  {details.buyerReferralCode}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(details.buyerReferralCode!, "Kode Referral")}
                >
                  <ClipboardCopy className="h-4 w-4 mr-2" /> Salin
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Bagikan kode ini dengan teman! Anda akan mendapatkan komisi jika mereka memesan menggunakan kode Anda.</p>
            </div>
          )}
          
          {details.paymentStatus === 'pending' && (
             <div className="space-y-4 rounded-md border bg-yellow-50 border-yellow-300 p-4">
                <h3 className="text-lg font-semibold text-yellow-700">Menunggu Pembayaran</h3>
                <p className="text-sm text-yellow-600">Harap selesaikan pembayaran Anda melalui Midtrans. Anda akan menerima email konfirmasi dan e-tiket setelah pembayaran berhasil diverifikasi.</p>
                <p className="text-xs text-yellow-500">Jika Anda sudah membayar, mohon tunggu beberapa saat hingga sistem kami memperbarui statusnya.</p>
            </div>
          )}

          {details.paymentStatus === 'failed' && (
             <div className="space-y-4 rounded-md border bg-red-50 border-red-300 p-4">
                <h3 className="text-lg font-semibold text-red-700">Pembayaran Gagal</h3>
                <p className="text-sm text-red-600">Sayangnya, pembayaran Anda tidak berhasil diproses. Anda dapat mencoba melakukan pemesanan lagi.</p>
                <Button asChild variant="destructive" className="mt-2">
                    <Link href={`/events/${params.eventId || ''}`}>Coba Pesan Lagi</Link>
                </Button>
            </div>
          )}

        </CardContent>
        <CardFooter className="p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
           <Button
            variant="outline"
            onClick={() => toast({
              title: "Informasi E-Tiket",
              description: "E-tiket Anda akan dikirimkan ke alamat email terdaftar setelah pembayaran berhasil diverifikasi oleh sistem kami dan diproses oleh Midtrans.",
            })}
          >
            <Download className="mr-2 h-4 w-4" /> Informasi E-Tiket
          </Button>
          <Button asChild>
            <Link href="/">Kembali ke Beranda</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
