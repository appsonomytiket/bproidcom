
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
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
import { CalendarPlus, Check, Loader2, PlusCircle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useState, useTransition } from "react";
import { formatISO } from "date-fns";
import type { Event } from "@/lib/types"; // Import Event type
import { MOCK_EVENTS, LOCAL_STORAGE_EVENTS_KEY } from "@/lib/constants"; // Import MOCK_EVENTS for initial seeding if needed

const priceTierSchema = z.object({
  name: z.string().min(1, { message: "Nama tier harus diisi." }),
  price: z.coerce.number().min(0, { message: "Harga tidak boleh negatif." }),
});

const addEventFormSchema = z.object({
  name: z.string().min(3, { message: "Nama acara minimal 3 karakter." }),
  date: z.date({ required_error: "Tanggal acara harus diisi." }),
  location: z.string().min(3, { message: "Lokasi minimal 3 karakter." }),
  priceTiers: z.array(priceTierSchema).min(1, { message: "Minimal harus ada satu tier harga." }),
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
      location: "",
      priceTiers: [{ name: "Regular", price: 0 }],
      description: "",
      imageUrl: "",
      organizer: "",
      category: "",
      availableTickets: 100,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "priceTiers",
  });

  function onSubmit(values: AddEventFormValues) {
    startTransition(async () => {
      const newEventId = `evt-${Date.now()}`;
      const newEvent: Event = { 
        id: newEventId,
        name: values.name,
        date: formatISO(values.date),
        location: values.location,
        priceTiers: values.priceTiers,
        description: values.description,
        imageUrl: values.imageUrl || "https://placehold.co/600x400.png", // Updated placeholder URL
        organizer: values.organizer,
        category: values.category,
        availableTickets: values.availableTickets,
      };

      // Save to localStorage
      try {
        const storedEventsString = localStorage.getItem(LOCAL_STORAGE_EVENTS_KEY);
        let allEvents: Event[] = [];
        if (storedEventsString) {
          allEvents = JSON.parse(storedEventsString);
        }
        
        const updatedEvents = [...allEvents, newEvent];
        localStorage.setItem(LOCAL_STORAGE_EVENTS_KEY, JSON.stringify(updatedEvents));
        
        toast({
          title: "Acara Ditambahkan",
          description: `${values.name} telah berhasil ditambahkan dan disimpan (secara lokal).`,
          action: <Check className="h-5 w-5 text-green-500" />,
        });

        router.push("/dashboard/admin/manage-events");

      } catch (error) {
        console.error("Gagal menyimpan acara ke localStorage:", error);
        toast({
          title: "Gagal Menyimpan Acara",
          description: "Terjadi masalah saat menyimpan acara secara lokal.",
          variant: "destructive",
        });
      }
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
                      disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
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
              
              <div>
                <FormLabel>Tier Harga</FormLabel>
                <div className="space-y-4 mt-2">
                  {fields.map((field, index) => (
                    <Card key={field.id} className="p-4 bg-secondary/30">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`priceTiers.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nama Tier {index + 1}</FormLabel>
                              <FormControl>
                                <Input placeholder="cth: Reguler, VIP" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`priceTiers.${index}.price`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Harga Tier {index + 1} (Rp)</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="cth: 150000" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => remove(index)}
                          className="mt-3"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Hapus Tier Ini
                        </Button>
                      )}
                    </Card>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ name: "", price: 0 })}
                  className="mt-4"
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Tambah Tier Harga
                </Button>
                 <FormMessage>{form.formState.errors.priceTiers?.root?.message || form.formState.errors.priceTiers?.message}</FormMessage>
              </div>


              <FormField
                control={form.control}
                name="availableTickets"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jumlah Total Tiket Tersedia</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Contoh: 500" {...field} />
                    </FormControl>
                    <FormDescription>Jumlah total tiket untuk semua tier.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                    <FormDescription>Jika kosong, placeholder standar akan digunakan. Pastikan URL valid jika diisi.</FormDescription>
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
