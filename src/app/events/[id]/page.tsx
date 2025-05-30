
"use client"; 

import Image from "next/image";
import React, { useEffect, useState } from "react"; 
// import { MOCK_EVENTS, LOCAL_STORAGE_EVENTS_KEY } from "@/lib/constants"; // No longer primary source
import type { Event } from "@/lib/types";
import { BookingForm } from "@/components/booking/BookingForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarDays, MapPin, Users, Tag, Building, Ticket, ListChecks, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabaseClient"; // Import Supabase client
import { useToast } from "@/hooks/use-toast";

interface EventDetailPageProps {
  params: { id: string };
}

// function getEventByIdClientSide(id: string): Event | undefined { // Replaced with Supabase fetch
//   let allEvents: Event[] = [];
//   if (typeof window !== 'undefined') {
//     const storedEventsString = localStorage.getItem(LOCAL_STORAGE_EVENTS_KEY);
//     if (storedEventsString) {
//       try {
//         allEvents = JSON.parse(storedEventsString);
//       } catch (e) {
//         console.error("Gagal mem-parse acara dari localStorage", e);
//         allEvents = MOCK_EVENTS;
//       }
//     } else {
//       allEvents = MOCK_EVENTS;
//     }
//   } else {
//     allEvents = MOCK_EVENTS;
//   }
  
//   const eventFromStorage = allEvents.find((event) => event.id === id);
//   if (eventFromStorage) {
//     return eventFromStorage;
//   }
//   return MOCK_EVENTS.find((event) => event.id === id);
// }


export default function EventDetailPage(props: EventDetailPageProps) {
  const resolvedParams = React.use(props.params); // Use React.use to resolve params
  const eventId = resolvedParams.id;

  const [event, setEvent] = useState<Event | null | undefined>(undefined); 
  const { toast } = useToast();

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) {
        setEvent(null); // No ID, no event
        return;
      }
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .single(); // We expect only one event or null

        if (error && error.code !== 'PGRST116') { // PGRST116: "Fetched result not found"
          throw error;
        }
        setEvent(data as Event | null); // Cast data to Event or null
      } catch (error: any) {
        console.error("Gagal memuat detail acara dari Supabase:", error);
        toast({
          title: "Gagal Memuat Detail Acara",
          description: error.message || "Terjadi masalah saat mengambil data acara.",
          variant: "destructive",
        });
        setEvent(null); // Set to null on error
      }
    };
    
    fetchEvent();
  }, [eventId, toast]); 

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
        <p className="text-muted-foreground">Acara dengan ID '{eventId}' tidak dapat ditemukan di database.</p>
      </div>
    );
  }

  const displayPrice = event.priceTiers && event.priceTiers.length > 0 ? event.priceTiers[0].price : 0;
  const formattedDate = event.date ? format(new Date(event.date), "EEEE, d MMMM yyyy 'pukul' HH:mm", { locale: idLocale }) : "Tanggal tidak tersedia";

  return (
    <div className="container py-12">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden shadow-xl">
            <CardHeader className="p-0">
              <div className="relative h-64 w-full md:h-96">
                <Image
                  src={event.imageUrl || "https://placehold.co/600x400.png"} // Fallback
                  alt={event.name}
                  fill 
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 67vw, 50vw" 
                  style={{ objectFit: "cover" }} 
                  data-ai-hint={event.category ? event.category.toLowerCase() : "event"}
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
                    <p>{formattedDate} WIB</p>
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
                          </div>
                          <div className="text-left sm:text-right">
                             <p className="text-xl font-bold text-accent">Rp {tier.price.toLocaleString()}</p>
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
