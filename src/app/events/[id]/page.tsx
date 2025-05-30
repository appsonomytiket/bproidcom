
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
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card className="overflow-hidden shadow-xl">
            <CardHeader className="p-0">
              <div className="relative h-64 w-full md:h-96">
                <Image
                  src={event.imageUrl}
                  alt={event.name}
                  layout="fill"
                  objectFit="cover"
                  data-ai-hint={`${event.category} event performance`}
                />
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <CardTitle className="mb-4 text-3xl font-bold text-primary md:text-4xl">
                {event.name}
              </CardTitle>
              
              <div className="mb-6 grid grid-cols-1 gap-4 text-muted-foreground sm:grid-cols-2">
                <div className="flex items-center">
                  <CalendarDays className="mr-3 h-5 w-5 text-accent" />
                  <span>{format(new Date(event.date), "EEEE, d MMMM yyyy 'pukul' p", { locale: idLocale })}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="mr-3 h-5 w-5 text-accent" />
                  <span>{event.location}</span>
                </div>
                <div className="flex items-center">
                  <Tag className="mr-3 h-5 w-5 text-accent" />
                  {event.priceTiers && event.priceTiers.length > 1 ? (
                     <span className="text-lg font-semibold text-foreground">Mulai dari Rp {displayPrice.toLocaleString()}</span>
                  ) : (
                     <span className="text-lg font-semibold text-foreground">Rp {displayPrice.toLocaleString()}</span>
                  )}
                </div>
                <div className="flex items-center">
                  <Building className="mr-3 h-5 w-5 text-accent" />
                  <span>Diselenggarakan oleh: {event.organizer}</span>
                </div>
                 <div className="flex items-center">
                  <Users className="mr-3 h-5 w-5 text-accent" />
                  <span>Kategori: {event.category}</span>
                </div>
                 <div className="flex items-center">
                  <Ticket className="mr-3 h-5 w-5 text-accent" />
                  <span>{event.availableTickets} tiket tersedia</span>
                </div>
              </div>
              
              <Separator className="my-6" />
              
              <h2 className="mb-3 text-xl font-semibold">Tentang acara ini</h2>
              <CardDescription className="whitespace-pre-line text-base leading-relaxed">
                {event.description}
              </CardDescription>

              {event.priceTiers && event.priceTiers.length > 0 && (
                <>
                  <Separator className="my-6" />
                  <h2 className="mb-3 text-xl font-semibold flex items-center">
                    <ListChecks className="mr-3 h-6 w-6 text-accent" />
                    Pilihan Tiket
                  </h2>
                  <ul className="space-y-3">
                    {event.priceTiers.map((tier, index) => (
                      <li key={index} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg shadow-sm bg-secondary/20">
                        <span className="font-medium text-foreground">{tier.name}</span>
                        <span className="font-semibold text-primary text-lg">Rp {tier.price.toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1">
          <Card className="sticky top-24 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-primary">Pesan Tiket Anda</CardTitle>
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
  return MOCK_EVENTS.map((event) => ({
    id: event.id,
  }));
}
