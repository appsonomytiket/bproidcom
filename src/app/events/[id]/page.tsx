
import Image from "next/image";
import { MOCK_EVENTS } from "@/lib/constants";
import type { Event } from "@/lib/types";
import { BookingForm } from "@/components/booking/BookingForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarDays, MapPin, Users, Tag, Building, Ticket, ListChecks } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Separator } from "@/components/ui/separator";

interface EventDetailPageProps {
  params: { id: string };
}

async function getEventById(id: string): Promise<Event | undefined> {
  return MOCK_EVENTS.find((event) => event.id === id);
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const event = await getEventById(params.id);

  if (!event) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-2xl font-semibold">Acara tidak ditemukan</h1>
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
                  layout="fill"
                  objectFit="cover"
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

export async function generateStaticParams() {
  // In a real app, fetch this from your data source (e.g., database)
  const events = MOCK_EVENTS; 
  return events.map((event) => ({
    id: event.id,
  }));
}

// Optional: Revalidate data at intervals if events can change frequently
// export const revalidate = 3600; // Revalidate every hour
