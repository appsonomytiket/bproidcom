
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
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/datepicker";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarPlus, Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useState, useTransition } from "react";
import { formatISO } from "date-fns"; // To format date to ISO string

const addEventFormSchema = z.object({
  name: z.string().min(3, { message: "Nama acara minimal 3 karakter." }),
  date: z.date({ required_error: "Tanggal acara harus diisi." }),
  location: z.string().min(3, { message: "Lokasi minimal 3 karakter." }),
  price: z.coerce.number().min(0, { message: "Harga tidak boleh negatif." }),
  description: z.string().min(10, { message: "Deskripsi minimal 10 karakter." }),
  imageUrl: z.string().url({ message: "URL gambar tidak valid." }).optional().or(z.literal('')),
  organizer: z.string().min(2, { message: "Penyelenggara minimal 2 karakter." }),
  category: z.string().min(2, { message: "Kategori minimal 2 karakter." }),
  availableTickets: z.coerce.number().min(0, { message: "Jumlah tiket tidak boleh negatif." }),
});

type AddEventFormValues = z.infer<typeof addEventFormSchema>;

export default function AddEventPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<AddEventFormValues>({
    resolver: zodResolver(addEventFormSchema),
    defaultValues: {
      name: "",
      // date: undefined, // Handled by DatePicker
      location: "",
      price: 0,
      description: "",
      imageUrl: "",
      organizer: "",
      category: "",
      availableTickets: 100,
    },
  });

  function onSubmit(values: AddEventFormValues) {
    startTransition(async () => {
      const newEventId = `evt-${Date.now()}`;
      const newEvent = {
        id: newEventId,
        ...values,
        date: formatISO(values.date), // Convert Date object to ISO string
        imageUrl: values.imageUrl || `https://placehold.co/600x400.png?text=${encodeURIComponent(values.name)}`, // Default placeholder if empty
      };

      console.log("Acara Baru (Simulasi):", newEvent);
      
      // In a real app, you would send this to your backend API
      // For now, we just simulate and redirect

      toast({
        title: "Acara Ditambahkan (Simulasi)",
        description: `${values.name} telah berhasil ditambahkan (simulasi).`,
        action: <Check className="h-5 w-5 text-green-500" />,
      });

      router.push("/dashboard/admin/manage-events");
      // To make it appear in the list on manage-events page, we'd need a backend
      // or more complex client-side state management. For now, it just redirects.
    });
  }

  return (
    <div className="container py-12">
      <Card className="mx-auto max-w-2xl shadow-xl">
        <CardHeader className="bg-primary text-primary-foreground p-6 rounded-t-lg">
          <div className="flex items-center gap-3">
            <CalendarPlus className="h-10 w-10" />
            <div>
              <CardTitle className="text-3xl font-bold">Tambah Acara Baru</CardTitle>
              <CardDescription className="text-primary-foreground/80">
                Isi detail acara di bawah ini.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Acara</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Konser Akbar" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Tanggal & Waktu Acara</FormLabel>
                    <DatePicker 
                      date={field.value} 
                      setDate={field.onChange} 
                      disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))} // Disable past dates
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lokasi Acara</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Stadion Gelora Bung Karno" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Harga Tiket (Rp)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Contoh: 150000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="availableTickets"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jumlah Tiket Tersedia</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Contoh: 500" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deskripsi Acara</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Jelaskan secara singkat tentang acara Anda..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL Gambar Acara (Opsional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://contoh.com/gambar.jpg" {...field} />
                    </FormControl>
                    <FormDescription>Jika kosong, placeholder akan digunakan.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="organizer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Penyelenggara</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Event Organizer Pro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategori Acara</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Musik, Workshop, Olahraga" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" disabled={isPending} className="w-full bg-accent hover:bg-accent/90">
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Simpan Acara
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
