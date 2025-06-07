// src/app/my-tickets/page.tsx
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient'; // Import supabase client
import type { Booking } from '@/lib/types'; // Ensure Booking type includes ticket_pdf_url
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Ticket, CalendarDays, MapPin, Users, Download, Eye, Loader2, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

export default function MyTicketsPage() {
  const [userTickets, setUserTickets] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserTickets = async () => {
      setLoading(true);
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // This page should be protected by middleware, but as a fallback:
        setError("Anda harus login untuk melihat tiket Anda.");
        setLoading(false);
        // Optionally redirect to login, though middleware should handle this.
        // router.push('/login'); 
        return;
      }

      const { data: ticketsData, error: fetchError } = await supabase
        .from('bookings')
        .select(`
          *,
          events (
            id,
            name,
            location,
            image_url
          )
        `)
        .eq('user_id', user.id)
        .order('booking_date', { ascending: false });

      if (fetchError) {
        console.error("Error fetching user tickets:", fetchError);
        setError("Gagal memuat tiket Anda. Silakan coba lagi.");
        toast({
          title: "Gagal Memuat Tiket",
          description: fetchError.message,
          variant: "destructive",
        });
      } else if (ticketsData) {
        const mappedTickets = ticketsData.map((ticket: any) => ({
          id: ticket.id,
          eventId: ticket.event_id,
          eventName: ticket.event_name,
          userName: ticket.user_name,
          userEmail: ticket.user_email,
          tickets: ticket.tickets,
          totalPrice: ticket.total_price,
          bookingDate: ticket.booking_date,
          paymentStatus: ticket.payment_status,
          couponCode: ticket.coupon_code,
          discountAmount: ticket.discount_amount,
          selectedTierName: ticket.selected_tier_name,
          selectedTierPrice: ticket.selected_tier_price,
          usedReferralCode: ticket.used_referral_code,
          buyerReferralCode: ticket.buyer_referral_code,
          ticket_pdf_url: ticket.ticket_pdf_url,
          midtrans_token: ticket.midtrans_token,
          midtrans_redirect_url: ticket.midtrans_redirect_url,
          midtrans_order_id: ticket.midtrans_order_id,
          checked_in: ticket.checked_in,
          checked_in_at: ticket.checked_in_at,
          created_at: ticket.created_at,
          updated_at: ticket.updated_at,
          events: ticket.events ? { // Map nested events object if it exists
            id: ticket.events.id,
            name: ticket.events.name,
            location: ticket.events.location,
            imageUrl: ticket.events.image_url,
            // Add other Event properties if needed and fetched
          } : undefined,
        }));
        setUserTickets(mappedTickets as Booking[]);
      } else {
        setUserTickets([]);
      }
      setLoading(false);
    };

    fetchUserTickets();
  }, [toast]);

  if (loading) {
    return (
      <div className="container flex min-h-[calc(100vh-10rem)] items-center justify-center py-12 text-center">
        <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
        <p className="text-xl font-semibold">Memuat tiket Anda...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center py-12 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Oops! Terjadi Kesalahan</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button asChild>
          <Link href="/">Kembali ke Beranda</Link>
        </Button>
      </div>
    );
  }
  

  return (
    <div className="container py-12">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <h1 className="text-3xl font-bold text-primary flex items-center">
          <Ticket className="mr-3 h-8 w-8" />
          Tiket Saya
        </h1>
        {/* Optional: Add a filter or sort functionality here */}
      </div>

      {userTickets.length === 0 ? (
        <Card className="shadow-lg">
          <CardContent className="p-10 text-center">
            <Ticket className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-xl font-semibold text-muted-foreground">Anda belum memiliki tiket.</p>
            <p className="text-sm text-muted-foreground mt-2">Jelajahi acara menarik dan pesan tiket Anda sekarang!</p>
            <Button asChild className="mt-6">
              <Link href="/">Cari Acara</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {userTickets.map((ticket) => (
            <Card key={ticket.id} className="flex flex-col overflow-hidden rounded-lg shadow-lg transition-shadow hover:shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl font-semibold leading-tight text-primary">{ticket.eventName || ticket.events?.name || 'Nama Acara Tidak Tersedia'}</CardTitle>
                <CardDescription>ID Pemesanan: {ticket.id}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-3 text-sm">
                <div className="flex items-center">
                  <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
                  {/* Use bookingDate (camelCase) */}
                  <span>{format(parseISO(ticket.bookingDate), "EEEE, dd MMMM yyyy, HH:mm", { locale: idLocale })}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{ticket.events?.location || 'Lokasi Tidak Tersedia'}</span>
                </div>
                <div className="flex items-center">
                  <Ticket className="mr-2 h-4 w-4 text-muted-foreground" />
                  {/* Use selectedTierName (camelCase) */}
                  <span>{ticket.tickets} Tiket ({ticket.selectedTierName || 'N/A'})</span>
                </div>
                 <div className="flex items-center">
                  <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                  {/* Use userName (camelCase) */}
                  <span>Atas nama: {ticket.userName}</span>
                </div>
                <div className="font-semibold text-base">
                  {/* Use totalPrice (camelCase) */}
                  Total: Rp {ticket.totalPrice.toLocaleString()}
                </div>
                {/* Use paymentStatus (camelCase) */}
                <div className={`text-sm font-medium ${ticket.paymentStatus === 'paid' ? 'text-green-600' : ticket.paymentStatus === 'pending' ? 'text-orange-500' : 'text-red-500'}`}>
                  Status Pembayaran: {ticket.paymentStatus === 'paid' ? 'Lunas' : ticket.paymentStatus === 'pending' ? 'Tertunda' : 'Gagal'}
                </div>
                {/* Use checked_in and checked_in_at (camelCase for checked_in_at if mapped, or ensure type consistency) */}
                {ticket.checked_in && ticket.checked_in_at && (
                  <div className="text-sm font-medium text-blue-600">
                    Status Check-in: Sudah Check-in ({format(parseISO(ticket.checked_in_at), "dd MMM yyyy, HH:mm", { locale: idLocale })})
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row gap-2 pt-4">
                <Button variant="outline" asChild className="w-full sm:w-auto">
                  {/* Use eventId (camelCase) */}
                  <Link href={`/events/${ticket.eventId}`}>
                    <Eye className="mr-2 h-4 w-4" /> Lihat Detail Acara
                  </Link>
                </Button>
                <Button 
                  asChild 
                  className="w-full sm:w-auto"
                  // Use paymentStatus and ticket_pdf_url (camelCase for ticket_pdf_url if mapped)
                  disabled={ticket.paymentStatus !== 'paid' || !ticket.ticket_pdf_url}
                >
                  <Link 
                    href={ticket.ticket_pdf_url || '#'} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      if (ticket.paymentStatus !== 'paid' || !ticket.ticket_pdf_url) {
                        e.preventDefault();
                        toast({
                          title: "E-Tiket Belum Tersedia",
                          description: ticket.paymentStatus !== 'paid' 
                            ? "Pembayaran untuk tiket ini belum lunas." 
                            : "URL E-Tiket belum tersedia. Silakan cek kembali nanti.",
                          variant: "default"
                        });
                      }
                    }}
                  > 
                    <Download className="mr-2 h-4 w-4" /> Unduh E-Tiket
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
