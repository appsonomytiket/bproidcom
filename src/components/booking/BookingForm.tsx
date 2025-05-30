
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import type { Event, EventPriceTier } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Ticket, User, Mail, Tag } from "lucide-react";
import { useEffect, useState } from "react";

const bookingFormSchema = z.object({
  name: z.string().min(2, { message: "Nama minimal 2 karakter." }),
  email: z.string().email({ message: "Alamat email tidak valid." }),
  selectedTierName: z.string().min(1, { message: "Pilih jenis tiket." }),
  tickets: z.coerce.number().min(1, { message: "Minimal pesan 1 tiket." }).max(10, { message: "Tidak dapat memesan lebih dari 10 tiket sekaligus."}),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

interface BookingFormProps {
  event: Event;
}

export function BookingForm({ event }: BookingFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedTier, setSelectedTier] = useState<EventPriceTier | undefined>(
    event.priceTiers && event.priceTiers.length > 0 ? event.priceTiers[0] : undefined
  );

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      name: "",
      email: "",
      selectedTierName: selectedTier?.name || "",
      tickets: 1,
    },
  });

  useEffect(() => {
    if (event.priceTiers && event.priceTiers.length > 0 && !form.getValues("selectedTierName")) {
      const defaultTier = event.priceTiers[0];
      form.setValue("selectedTierName", defaultTier.name);
      setSelectedTier(defaultTier);
    }
  }, [event.priceTiers, form]);
  

  const currentTickets = form.watch("tickets");
  const currentSelectedTierName = form.watch("selectedTierName");

  useEffect(() => {
    const tier = event.priceTiers.find(t => t.name === currentSelectedTierName);
    setSelectedTier(tier);
  }, [currentSelectedTierName, event.priceTiers]);

  const totalPrice = selectedTier ? currentTickets * selectedTier.price : 0;

  async function onSubmit(values: BookingFormValues) {
    if (!selectedTier) {
      toast({
        title: "Kesalahan Pemesanan",
        description: "Tier tiket tidak valid.",
        variant: "destructive",
      });
      return;
    }

    console.log("Pemesanan dikirim:", values);
    
    const bookingId = `BK-${Date.now().toString().slice(-6)}`;
    
    toast({
      title: "Pemesanan Terkirim!",
      description: `Pemesanan Anda untuk ${event.name} (${selectedTier.name}) sedang diproses.`,
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem('bookingDetails', JSON.stringify({
        name: values.name,
        email: values.email,
        tickets: values.tickets,
        bookingId,
        eventName: event.name,
        totalPrice: totalPrice,
        selectedTierName: selectedTier.name,
        selectedTierPrice: selectedTier.price,
      }));
    }
    
    router.push(`/booking/confirmation/${bookingId}`);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 rounded-lg border bg-card p-6 shadow-md">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><User className="mr-2 h-4 w-4 text-primary" />Nama Lengkap</FormLabel>
              <FormControl>
                <Input placeholder="Masukkan nama lengkap Anda" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><Mail className="mr-2 h-4 w-4 text-primary" />Alamat Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Masukkan email Anda" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {event.priceTiers && event.priceTiers.length > 0 && (
          <FormField
            control={form.control}
            name="selectedTierName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center"><Tag className="mr-2 h-4 w-4 text-primary" />Jenis Tiket</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis tiket" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {event.priceTiers.map((tier) => (
                      <SelectItem key={tier.name} value={tier.name}>
                        {tier.name} (Rp {tier.price.toLocaleString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="tickets"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><Ticket className="mr-2 h-4 w-4 text-primary" />Jumlah Tiket</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min="1" 
                  max={event.availableTickets > 10 ? 10 : event.availableTickets} 
                  placeholder="Jumlah tiket" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="text-lg font-semibold">
          Total Harga: Rp {totalPrice.toLocaleString()}
        </div>
        <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={!selectedTier}>
          Pesan Sekarang
        </Button>
      </form>
    </Form>
  );
}
