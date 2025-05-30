
"use client"; // Make this a client component

import Image from "next/image";
import { useEffect, useState } from "react"; // Import useEffect and useState
import { MOCK_EVENTS, LOCAL_STORAGE_EVENTS_KEY } from "@/lib/constants"; // Import LOCAL_STORAGE_EVENTS_KEY
import type { Event } from "@/lib/types";
import { BookingForm } from "@/components/booking/BookingForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarDays, MapPin, Users, Tag, Building, Ticket, ListChecks, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Separator } from "@/components/ui/separator";

interface EventDetailPageProps {
  params: { id: string };
}

// This function will now be used client-side
function getEventByIdClientSide(id: string): Event | undefined {
  let allEvents: Event[] = [];
  if (typeof window !== 'undefined') {
    const storedEventsString = localStorage.getItem(LOCAL_STORAGE_EVENTS_KEY);
    if (storedEventsString) {
      try {
        allEvents = JSON.parse(storedEventsString);
      } catch (e) {
        console.error("Failed to parse events from localStorage", e);
        // Fallback to MOCK_EVENTS if localStorage is corrupted
        allEvents = MOCK_EVENTS;
      }
    } else {
      // If localStorage is empty, use MOCK_EVENTS (though manage-events page should seed it)
      allEvents = MOCK_EVENTS;
    }
  } else {
    // Fallback for environments where localStorage is not available (should not happen in browser)
    allEvents = MOCK_EVENTS;
  }
  
  const eventFromStorage = allEvents.find((event) => event.id === id);
  if (eventFromStorage) {
    return eventFromStorage;
  }
  // If not in localStorage (e.g. direct navigation to a MOCK_EVENT not yet in localStorage)
  // check MOCK_EVENTS as a final fallback.
  return MOCK_EVENTS.find((event) => event.id === id);
}


export default function EventDetailPage({ params }: EventDetailPageProps) {
  const [event, setEvent] = useState<Event | null | undefined>(undefined); // undefined for loading, null for not found

  useEffect(() => {
    if (params.id) {
      const foundEvent = getEventByIdClientSide(params.id);
      setEvent(foundEvent || null); // Set to null if not found
    }
  }, [params.id]);

  if (event === undefined) {
    return (
      <div className="container flex min-h-[calc(100vh-10rem)] items-center justify-center py-12 text-center">
        <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
        <p className="text-xl font-semibold">Memuat detail acara...</p>
      </div>
    );
  }

  if (event === null) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-2xl font-semibold">Acara tidak ditemukan</h1>
        <p className="text-muted-foreground">Acara dengan ID '{params.id}' tidak dapat ditemukan di penyimpanan lokal atau data mock.</p>
      </div>
    );
  }

  const displayPrice = event.priceTiers && event.priceTiers.length > 0 ? event.priceTiers[0].price : 0;

  return (
    <div className="container py-12">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden shadow-xl">
            <CardHeader className="p-0">
              <div className="relative h-64 w-full md:h-96">
                <Image
                  src={event.imageUrl}
                  alt={event.name}
                  fill // Use fill instead of layout="fill"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // Provide sizes prop
                  style={{ objectFit: "cover" }} // Use style for objectFit
                  data-ai-hint={`${event.category.toLowerCase()} event`}
                  priority
                />
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <CardTitle className="mb-4 text-3xl font-bold text-primary md:text-4xl">
                {event.name}
              </CardTitle>
              
              <div className="mb-6 grid grid-cols-1 gap-4 text-muted-foreground sm:grid-cols-2 md:gap-5">
                <div className="flex items-start">
                  <CalendarDays className="mr-3 mt-1 h-5 w-5 flex-shrink-0 text-accent" />
                  <div>
                    <span className="font-semibold text-foreground">Tanggal & Waktu</span>
                    <p>{format(new Date(event.date), "EEEE, d MMMM yyyy 'pukul' HH:mm", { locale: idLocale })} WIB</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <MapPin className="mr-3 mt-1 h-5 w-5 flex-shrink-0 text-accent" />
                  <div>
                    <span className="font-semibold text-foreground">Lokasi</span>
                    <p>{event.location}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Tag className="mr-3 mt-1 h-5 w-5 flex-shrink-0 text-accent" />
                   <div>
                    <span className="font-semibold text-foreground">Harga Mulai</span>
                    <p className="text-lg font-semibold">Rp {displayPrice.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Building className="mr-3 mt-1 h-5 w-5 flex-shrink-0 text-accent" />
                  <div>
                    <span className="font-semibold text-foreground">Penyelenggara</span>
                    <p>{event.organizer}</p>
                  </div>
                </div>
                 <div className="flex items-start">
                  <Users className="mr-3 mt-1 h-5 w-5 flex-shrink-0 text-accent" />
                   <div>
                    <span className="font-semibold text-foreground">Kategori</span>
                    <p>{event.category}</p>
                  </div>
                </div>
                 <div className="flex items-start">
                  <Ticket className="mr-3 mt-1 h-5 w-5 flex-shrink-0 text-accent" />
                  <div>
                    <span className="font-semibold text-foreground">Tiket Tersedia</span>
                    <p>{event.availableTickets} tiket</p>
                  </div>
                </div>
              </div>
              
              <Separator className="my-6" />
              
              <div>
                <h2 className="mb-3 text-2xl font-semibold text-foreground">Tentang Acara Ini</h2>
                <CardDescription className="whitespace-pre-line text-base leading-relaxed text-foreground/80">
                  {event.description}
                </CardDescription>
              </div>

              {event.priceTiers && event.priceTiers.length > 0 && (
                <>
                  <Separator className="my-8" />
                  <div className="mb-6">
                    <h2 className="text-2xl font-semibold text-foreground flex items-center">
                      <ListChecks className="mr-3 h-7 w-7 text-accent" />
                      Pilihan Tiket
                    </h2>
                    <p className="text-muted-foreground">Pilih jenis tiket yang paling sesuai untuk Anda.</p>
                  </div>
                  <div className="space-y-4">
                    {event.priceTiers.map((tier, index) => (
                      <Card key={index} className="bg-card border shadow-md hover:shadow-lg transition-shadow">
                        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                          <div>
                            <h3 className="text-lg font-semibold text-primary">{tier.name}</h3>
                            {/* Tambahkan deskripsi singkat tier jika ada */}
                            {/* <p className="text-sm text-muted-foreground">Deskripsi singkat untuk tier ini.</p> */}
                          </div>
                          <div className="text-left sm:text-right">
                             <p className="text-xl font-bold text-accent">Rp {tier.price.toLocaleString()}</p>
                             {/* <p className="text-xs text-muted-foreground">per tiket</p> */}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-24 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-primary">Pesan Tiket Anda</CardTitle>
              <CardDescription>Amankan tempat Anda sekarang!</CardDescription>
            </CardHeader>
            <CardContent>
              <BookingForm event={event} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// generateStaticParams remains server-side and uses MOCK_EVENTS for build-time generation
export async function generateStaticParams() {
  const events = MOCK_EVENTS; 
  return events.map((event) => ({
    id: event.id,
  }));
}

// Optional: Revalidate data at intervals if events can change frequently
// export const revalidate = 3600; // Revalidate every hour
