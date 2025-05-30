
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
import { Ticket, User, Mail, Phone } from "lucide-react";

const bookingFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  tickets: z.coerce.number().min(1, { message: "Must book at least 1 ticket." }).max(10, { message: "Cannot book more than 10 tickets at a time."}),
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
    console.log("Booking submitted:", values);
    
    // Simulate generating a booking ID
    const bookingId = `BK-${Date.now().toString().slice(-6)}`;
    
    toast({
      title: "Booking Submitted!",
      description: `Your booking for ${event.name} is being processed.`,
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
              <FormLabel className="flex items-center"><User className="mr-2 h-4 w-4 text-primary" />Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter your full name" {...field} />
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
              <FormLabel className="flex items-center"><Mail className="mr-2 h-4 w-4 text-primary" />Email Address</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Enter your email" {...field} />
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
              <FormLabel className="flex items-center"><Ticket className="mr-2 h-4 w-4 text-primary" />Number of Tickets</FormLabel>
              <FormControl>
                <Input type="number" min="1" max={event.availableTickets > 10 ? 10 : event.availableTickets} placeholder="Number of tickets" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="text-lg font-semibold">
          Total Price: Rp {(form.watch("tickets") * event.price).toLocaleString()}
        </div>
        <Button type="submit" className="w-full bg-accent hover:bg-accent/90">
          Book Now
        </Button>
      </form>
    </Form>
  );
}
