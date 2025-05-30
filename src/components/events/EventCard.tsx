
"use client";

import Image from "next/image";
import Link from "next/link";
import type { Event } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, MapPin, Tag } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { useState, useEffect } from "react";

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const [formattedDate, setFormattedDate] = useState<string | null>(null);

  useEffect(() => {
    setFormattedDate(format(new Date(event.date), "PPPp", { locale: idLocale }));
  }, [event.date]);

  const displayPrice = event.priceTiers && event.priceTiers.length > 0
    ? event.priceTiers[0].price
    : 0;
  
  const displayTierName = event.priceTiers && event.priceTiers.length > 0
    ? event.priceTiers[0].name
    : "";

  return (
    <Card className="flex flex-col overflow-hidden rounded-lg shadow-lg transition-shadow hover:shadow-xl">
      <CardHeader className="p-0">
        <div className="relative h-48 w-full">
          <Image
            src={event.imageUrl}
            alt={event.name}
            layout="fill"
            objectFit="cover"
            data-ai-hint={`${event.category} event`}
          />
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-6">
        <CardTitle className="mb-2 text-xl font-semibold leading-tight">{event.name}</CardTitle>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center">
            <CalendarDays className="mr-2 h-4 w-4" />
            <span>{formattedDate || "Memuat tanggal..."}</span>
          </div>
          <div className="flex items-center">
            <MapPin className="mr-2 h-4 w-4" />
            <span>{event.location}</span>
          </div>
          <div className="flex items-center">
            <Tag className="mr-2 h-4 w-4" />
            {event.priceTiers && event.priceTiers.length > 1 ? (
              <span>Mulai Rp {displayPrice.toLocaleString()}</span>
            ) : (
              <span>Rp {displayPrice.toLocaleString()} {displayTierName && `(${displayTierName})`}</span>
            )}
          </div>
        </div>
        <CardDescription className="mt-3 line-clamp-3 text-sm">
          {event.description}
        </CardDescription>
      </CardContent>
      <CardFooter className="p-6 pt-0">
        <Button asChild className="w-full" variant="default">
          <Link href={`/events/${event.id}`}>Lihat Detail</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
