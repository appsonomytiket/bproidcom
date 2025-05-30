
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import type { Event } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Ticket, User, Mail } from "lucide-react"; // Removed Phone icon as it's not used

const bookingFormSchema = z.object({
  name: z.string().min(2, { message: "Nama minimal 2 karakter." }),
  email: z.string().email({ message: "Alamat email tidak valid." }),
  tickets: z.coerce.number().min(1, { message: "Minimal pesan 1 tiket." }).max(10, { message: "Tidak dapat memesan lebih dari 10 tiket sekaligus."}),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

interface BookingFormProps {
  event: Event;
}

export function BookingForm({ event }: BookingFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      name: "",
      email: "",
      tickets: 1,
    },
  });

  async function onSubmit(values: BookingFormValues) {
    // Simulate booking submission
    console.log("Pemesanan dikirim:", values);
    
    // Simulate generating a booking ID
    const bookingId = `BK-${Date.now().toString().slice(-6)}`;
    
    toast({
      title: "Pemesanan Terkirim!",
      description: `Pemesanan Anda untuk ${event.name} sedang diproses.`,
    });

    // Store booking details in localStorage for confirmation page (temporary)
    if (typeof window !== 'undefined') {
      localStorage.setItem('bookingDetails', JSON.stringify({
        ...values,
        bookingId,
        eventName: event.name,
        eventPrice: event.price,
        totalPrice: values.tickets * event.price,
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
        <FormField
          control={form.control}
          name="tickets"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><Ticket className="mr-2 h-4 w-4 text-primary" />Jumlah Tiket</FormLabel>
              <FormControl>
                <Input type="number" min="1" max={event.availableTickets > 10 ? 10 : event.availableTickets} placeholder="Jumlah tiket" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="text-lg font-semibold">
          Total Harga: Rp {(form.watch("tickets") * event.price).toLocaleString()}
        </div>
        <Button type="submit" className="w-full bg-accent hover:bg-accent/90">
          Pesan Sekarang
        </Button>
      </form>
    </Form>
  );
}
