
// src/app/my-tickets/page.tsx
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MOCK_RECENT_BOOKINGS_ADMIN } from '@/lib/constants';
import type { Booking } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Ticket, CalendarDays, MapPin, Users, Download, Eye } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

// Simulate a logged-in user
const MOCK_LOGGED_IN_USER_NAME = "Andi Pratama"; // Change this to test with other mock users

export default function MyTicketsPage() {
  const [userTickets, setUserTickets] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching tickets for the logged-in user
    const filteredTickets = MOCK_RECENT_BOOKINGS_ADMIN.filter(
      (booking) => booking.userName === MOCK_LOGGED_IN_USER_NAME
    );
    setUserTickets(filteredTickets);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="container flex min-h-[calc(100vh-10rem)] items-center justify-center py-12">
        <p>Memuat tiket Anda...</p>
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
                <CardTitle className="text-xl font-semibold leading-tight text-primary">{ticket.eventName}</CardTitle>
                <CardDescription>ID Pemesanan: {ticket.id}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-3 text-sm">
                <div className="flex items-center">
                  <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{format(parseISO(ticket.bookingDate), "EEEE, dd MMMM yyyy", { locale: idLocale })}</span>
                </div>
                {/* Assuming event details might not be directly on booking, 
                    we might need to fetch event details by eventId in a real app
                    For now, let's use placeholder for location or fetch from MOCK_EVENTS if needed */}
                <div className="flex items-center">
                  <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{MOCK_RECENT_BOOKINGS_ADMIN.find(e => e.id === ticket.id)?.eventName.includes("Konser") ? "Lapangan Banteng, Jakarta" : "Hotel Indonesia Kempinski, Jakarta" }</span>
                </div>
                <div className="flex items-center">
                  <Ticket className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{ticket.tickets} Tiket ({ticket.selectedTierName || 'N/A'})</span>
                </div>
                 <div className="flex items-center">
                  <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Atas nama: {ticket.userName}</span>
                </div>
                <div className="font-semibold text-base">
                  Total: Rp {ticket.totalPrice.toLocaleString()}
                </div>
                <div className={`text-sm font-medium ${ticket.paymentStatus === 'paid' ? 'text-green-600' : 'text-orange-500'}`}>
                  Status Pembayaran: {ticket.paymentStatus === 'paid' ? 'Lunas' : ticket.paymentStatus === 'pending' ? 'Tertunda' : 'Gagal'}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row gap-2 pt-4">
                <Button variant="outline" asChild className="w-full sm:w-auto">
                  <Link href={`/events/${ticket.eventId}`}>
                    <Eye className="mr-2 h-4 w-4" /> Lihat Detail Acara
                  </Link>
                </Button>
                <Button asChild className="w-full sm:w-auto">
                  {/* Link to a dummy PDF or a page that would generate the e-ticket */}
                  <Link href="/"> 
                    <Download className="mr-2 h-4 w-4" /> Unduh E-Tiket (Contoh)
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

