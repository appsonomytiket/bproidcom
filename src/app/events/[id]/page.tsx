
import Image from "next/image";
import { MOCK_EVENTS } from "@/lib/constants";
import type { Event } from "@/lib/types";
import { BookingForm } from "@/components/booking/BookingForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarDays, MapPin, Users, Tag, Building, Ticket } from "lucide-react"; // Added Ticket
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale"; // Import Indonesian locale
import { Separator } from "@/components/ui/separator";

interface EventDetailPageProps {
  params: { id: string };
}

// Simulate fetching a single event
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
                  <span className="text-lg font-semibold text-foreground">Rp {event.price.toLocaleString()}</span>
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
