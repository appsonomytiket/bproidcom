
"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { CheckCircle, ClipboardCopy, Download, Ticket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MOCK_USERS } from '@/lib/constants'; // Import MOCK_USERS to find sponsor

interface BookingDetails {
  bookingId: string;
  eventName: string;
  name: string;
  email: string;
  tickets: number;
  totalPrice: number;
  referralCode?: string; // Buyer's new referral code
  selectedTierName?: string;
  selectedTierPrice?: number;
  usedReferralCode?: string; // Sponsor's referral code used for this booking
  sponsorName?: string; // Name of the sponsor
}

export default function BookingConfirmationPage() {
  const params = useParams();
  const { bookingId } = params;
  const [details, setDetails] = useState<BookingDetails | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedDetailsString = localStorage.getItem('bookingDetails');
      if (storedDetailsString) {
        const parsedDetails: Omit<BookingDetails, 'sponsorName' | 'referralCode'> & { usedReferralCode?: string, name: string } = JSON.parse(storedDetailsString);
        
        if (parsedDetails.bookingId === bookingId) {
          const buyerReferralCode = `${parsedDetails.name.substring(0,3).toUpperCase()}${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
          let foundSponsorName: string | undefined = undefined;

          if (parsedDetails.usedReferralCode) {
            const sponsor = MOCK_USERS.find(user => user.affiliateCode === parsedDetails.usedReferralCode && user.roles.includes('affiliate'));
            if (sponsor) {
              foundSponsorName = sponsor.name;
            } else {
              // Optionally, handle case where usedReferralCode is present but no matching sponsor found
              // console.warn(`Sponsor dengan kode ${parsedDetails.usedReferralCode} tidak ditemukan.`);
            }
          }

          setDetails({
            ...(parsedDetails as BookingDetails), // Cast back to BookingDetails, assuming parsedDetails aligns
            bookingId: bookingId as string, // Ensure bookingId from params is used
            referralCode: buyerReferralCode, 
                            // @ts-ignore
            sponsorName: foundSponsorName 
          });

        } else {
          // Booking ID from URL doesn't match stored details, treat as potentially direct navigation or error
          setDetails({
            bookingId: bookingId as string,
            eventName: "Acara Tidak Diketahui",
            name: "N/A",
            email: "N/A",
            tickets: 0,
            totalPrice: 0,
            selectedTierName: "N/A",
            referralCode: "N/A", // Generate a dummy or leave as N/A
            sponsorName: undefined
          });
        }
      } else {
         // Handle case where no booking details are found, possibly direct navigation
         setDetails({
            bookingId: bookingId as string,
            eventName: "Detail Pemesanan Tidak Ditemukan",
            name: "N/A",
            email: "N/A",
            tickets: 0,
            totalPrice: 0,
            selectedTierName: "N/A",
            referralCode: "N/A",
            sponsorName: undefined
          });
      }
    }
  }, [bookingId]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: `${label} Disalin!`, description: `${text} telah disalin ke clipboard Anda.` });
    }).catch(err => {
      toast({ title: "Penyalinan Gagal", description: `Tidak dapat menyalin ${label}.`, variant: "destructive" });
      console.error('Gagal menyalin: ', err);
    });
  };
  
  if (!details) {
    return (
      <div className="container flex min-h-[calc(100vh-10rem)] items-center justify-center py-12">
        <p>Memuat detail pemesanan...</p>
      </div>
    );
  }

  const paymentInstructions = {
    bankTransfer: {
      bank: "Bank BCA",
      accountNumber: "123-456-7890",
      accountName: "PT Bproid Event Organizer",
    },
    qris: "https://placehold.co/200x200.png?text=QRIS+Placeholder",
  };

  return (
    <div className="container py-12">
      <Card className="mx-auto max-w-2xl shadow-xl">
        <CardHeader className="bg-primary text-primary-foreground p-6 rounded-t-lg">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-10 w-10" />
            <div>
              <CardTitle className="text-3xl font-bold">Pemesanan Dikonfirmasi!</CardTitle>
              <CardDescription className="text-primary-foreground/80">Tiket Anda untuk {details.eventName} telah dipesan.</CardDescription>
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
              <li><strong>Total Harga:</strong> Rp {details.totalPrice.toLocaleString()}</li>
            </ul>
          </div>

          {details.referralCode && details.referralCode !== "N/A" && (
             <div>
              <h3 className="text-lg font-semibold mb-1">Kode Referral Anda:</h3>
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold text-accent p-2 border border-dashed border-accent rounded-md">
                  {details.referralCode}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(details.referralCode!, "Kode Referral")}
                >
                  <ClipboardCopy className="h-4 w-4 mr-2" /> Salin
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Bagikan kode ini dengan teman! Anda akan mendapatkan komisi jika mereka memesan menggunakan kode Anda.</p>
            </div>
          )}

          <div className="space-y-4 rounded-md border bg-secondary/30 p-4">
            <h3 className="text-lg font-semibold text-primary">Instruksi Pembayaran</h3>
            <p className="text-sm text-muted-foreground">Harap selesaikan pembayaran Anda dalam 24 jam untuk mengamankan tiket Anda. Jumlah yang harus dibayar: <strong>Rp {details.totalPrice.toLocaleString()}</strong></p>
            
            <div>
              <h4 className="font-semibold mb-1">Transfer Bank:</h4>
              <p className="text-sm">Bank: {paymentInstructions.bankTransfer.bank}</p>
              <div className="flex items-center gap-2">
                <p className="text-sm">Nomor Rekening: {paymentInstructions.bankTransfer.accountNumber}</p>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(paymentInstructions.bankTransfer.accountNumber, "Nomor Rekening")}>
                  <ClipboardCopy className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-sm">Atas Nama: {paymentInstructions.bankTransfer.accountName}</p>
            </div>

            <div>
              <h4 className="font-semibold mb-1">QRIS:</h4>
              <p className="text-sm mb-2">Pindai kode QR di bawah menggunakan e-wallet atau aplikasi mobile banking Anda.</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={paymentInstructions.qris} alt="Kode Pembayaran QRIS" className="rounded-md border" data-ai-hint="QR code" />
            </div>
            <p className="text-xs text-muted-foreground">Setelah pembayaran, harap kirim bukti transfer ke payments@bproid.com beserta ID Pemesanan Anda. <strong>E-tiket akan dikirimkan ke email Anda setelah pembayaran diverifikasi.</strong></p>
          </div>

          {details.sponsorName && (
            <div className="mt-6 border-t pt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Sponsormu: <span className="font-semibold text-accent">{details.sponsorName}</span>
              </p>
            </div>
          )}

        </CardContent>
        <CardFooter className="p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <Button
            variant="outline"
            onClick={() => toast({
              title: "E-Tiket Akan Dikirim",
              description: "E-tiket Anda akan dikirimkan ke alamat email terdaftar setelah pembayaran berhasil diverifikasi oleh tim kami.",
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
