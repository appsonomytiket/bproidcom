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
import { CalendarPlus, Check, Edit3, Loader2, PlusCircle, Trash2 } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useTransition, useState } from "react";
import { formatISO, parseISO } from "date-fns";
import type { Event as EventType } from "@/lib/types"; // Renamed to avoid conflict
import { createBrowserClient } from '@supabase/ssr';

// Schema for price tiers (can be part of a shared types file)
const priceTierSchema = z.object({
  id: z.string().optional(), // Tiers might have IDs if they are separate records or need stable keys
  name: z.string().min(1, { message: "Nama tier harus diisi." }),
  price: z.coerce.number().min(0, { message: "Harga tidak boleh negatif." }),
  available_tickets: z.coerce.number().min(0, {message: "Jumlah tiket tier tidak boleh negatif."}),
});

// Schema for the edit event form
const editEventFormSchema = z.object({
  name: z.string().min(3, { message: "Nama acara minimal 3 karakter." }),
  date: z.date({ required_error: "Tanggal acara harus diisi." }),
  location: z.string().min(3, { message: "Lokasi minimal 3 karakter." }),
  tiers: z.array(priceTierSchema).min(1, { message: "Minimal harus ada satu tier harga." }),
  description: z.string().min(10, { message: "Deskripsi minimal 10 karakter." }),
  imageUrl: z.string().url({ message: "URL gambar tidak valid." }).optional().or(z.literal('')),
  organizer: z.string().min(2, { message: "Penyelenggara minimal 2 karakter." }),
  category: z.string().min(2, { message: "Kategori minimal 2 karakter." }),
  // availableTickets is now derived from sum of tiers in the backend for update-event
  // but we might keep it for display or if the backend logic changes.
  // For now, let's make it optional or remove if backend solely relies on tier sum.
  // Let's remove it from direct schema validation if backend recalculates it.
});

type EditEventFormValues = z.infer<typeof editEventFormSchema>;

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isLoadingEvent, setIsLoadingEvent] = useState(true);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const form = useForm<EditEventFormValues>({
    resolver: zodResolver(editEventFormSchema),
    defaultValues: {
      name: "",
      location: "",
      tiers: [{ name: "Regular", price: 0, available_tickets: 0 }],
      description: "",
      imageUrl: "",
      organizer: "",
      category: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "tiers", // Changed from priceTiers to tiers to match DB
  });

  useEffect(() => {
    if (!eventId) return;

    const fetchEventData = async () => {
      setIsLoadingEvent(true);
      const { data: eventData, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (error || !eventData) {
        toast({
          title: "Gagal Memuat Acara",
          description: error?.message || "Acara tidak ditemukan.",
          variant: "destructive",
        });
        router.push("/dashboard/admin/manage-events");
        return;
      }
      
      // Map fetched data to form values
      form.reset({
        name: eventData.name,
        date: parseISO(eventData.date), // Parse ISO string back to Date object
        location: eventData.location,
        tiers: eventData.tiers || [{ name: "Regular", price: 0, available_tickets: 0 }], // Ensure tiers is an array
        description: eventData.description,
        imageUrl: eventData.image_url || "",
        organizer: eventData.organizer || "", // Assuming organizer is a field
        category: eventData.category || "",   // Assuming category is a field
      });
      setIsLoadingEvent(false);
    };

    fetchEventData();
  }, [eventId, supabase, form, router, toast]);


  async function onSubmit(values: EditEventFormValues) {
    startTransition(async () => {
      const eventToUpdate = {
        event_id: eventId,
        name: values.name,
        date: formatISO(values.date),
        location: values.location,
        tiers: values.tiers,
        description: values.description,
        image_url: values.imageUrl || null, // Send null if empty to clear image
        organizer: values.organizer,
        category: values.category,
      };

      try {
        const { data, error } = await supabase.functions.invoke('update-event', {
            body: eventToUpdate,
        });

        if (error) throw error;
        
        // The function might return the updated event in data.event
        const updatedEventName = (data as any)?.event?.name || values.name;

        toast({
          title: "Acara Diperbarui",
          description: `${updatedEventName} telah berhasil diperbarui.`,
          action: <Check className="h-5 w-5 text-green-500" />,
        });
        router.push("/dashboard/admin/manage-events");
      } catch (error: any) {
        console.error("Gagal memperbarui acara:", error);
        toast({
          title: "Gagal Memperbarui Acara",
          description: error.message || "Terjadi masalah saat memperbarui acara.",
          variant: "destructive",
        });
      }
    });
  }

  if (isLoadingEvent) {
    return (
      <div className="container flex min-h-[calc(100vh-10rem)] items-center justify-center py-12 text-center">
        <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
        <p className="text-xl font-semibold">Memuat detail acara...</p>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <Card className="mx-auto max-w-2xl shadow-xl">
        <CardHeader className="bg-primary text-primary-foreground p-6 rounded-t-lg">
          <div className="flex items-center gap-3">
            <Edit3 className="h-10 w-10" />
            <div>
              <CardTitle className="text-3xl font-bold">Edit Acara</CardTitle>
              <CardDescription className="text-primary-foreground/80">
                Perbarui detail acara di bawah ini.
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
                      // Allow past dates for editing, but validation might be needed if date cannot be in past
                      // disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
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
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <FormField
                          control={form.control}
                          name={`tiers.${index}.name`}
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
                          name={`tiers.${index}.price`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Harga (Rp)</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="cth: 150000" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                         <FormField
                          control={form.control}
                          name={`tiers.${index}.available_tickets`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tiket Tier</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="cth: 100" {...field} />
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
                  onClick={() => append({ name: "", price: 0, available_tickets: 0 })}
                  className="mt-4"
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Tambah Tier Harga
                </Button>
                 <FormMessage>{form.formState.errors.tiers?.root?.message || form.formState.errors.tiers?.message}</FormMessage>
              </div>

              {/* Removed availableTickets as a top-level field, it's now part of tiers and summed by backend */}

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
                    <FormDescription>Jika kosong, gambar tidak akan diubah. Masukkan URL baru untuk mengganti.</FormDescription>
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

              <Button type="submit" disabled={isPending || isLoadingEvent} className="w-full bg-accent hover:bg-accent/90">
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Simpan Perubahan Acara
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
