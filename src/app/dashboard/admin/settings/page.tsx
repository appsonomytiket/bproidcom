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
import { Label } from "@/components/ui/label"; // Added Label import
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SlidersHorizontal, BarChart2, Banknote, Save, Loader2, CreditCard, Info, Globe, Mail, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useTransition } from "react";
import { supabase } from "@/lib/supabaseClient";

// Define the shape of admin settings stored in the database
interface AdminSettingsDB {
  id: string;
  site_name?: string | null;
  default_event_image_url?: string | null;
  contact_email?: string | null;
  meta_pixel_id?: string | null;
  google_analytics_id?: string | null;
  manual_payment_bank_name?: string | null;
  manual_payment_account_number?: string | null;
  manual_payment_account_holder_name?: string | null;
  manual_payment_whatsapp?: string | null;
  midtrans_is_production?: boolean | null;
  created_at?: string;
  updated_at?: string;
}

const adminSettingsFormSchema = z.object({
  siteName: z.string().min(1, "Nama situs harus diisi.").optional().or(z.literal('')),
  defaultEventImageUrl: z.string().url("URL gambar default tidak valid.").optional().or(z.literal('')),
  contactEmail: z.string().email("Email kontak tidak valid.").optional().or(z.literal('')),
  metaPixelId: z.string().optional(),
  googleAnalyticsId: z.string().optional(),
  manualPaymentBankName: z.string().optional(),
  manualPaymentAccountNumber: z.string().optional(),
  manualPaymentAccountHolderName: z.string().optional(),
  manualPaymentWhatsapp: z.string().optional().refine(val => !val || /^\+?\d+$/.test(val), {
    message: "Nomor WhatsApp tidak valid (contoh: +6281234567890).",
  }),
  midtransIsProduction: z.boolean().default(false),
});

type AdminSettingsFormValues = z.infer<typeof adminSettingsFormSchema>;

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<AdminSettingsFormValues>({
    resolver: zodResolver(adminSettingsFormSchema),
    defaultValues: {
      siteName: "",
      defaultEventImageUrl: "",
      contactEmail: "",
      metaPixelId: "",
      googleAnalyticsId: "",
      manualPaymentBankName: "",
      manualPaymentAccountNumber: "",
      manualPaymentAccountHolderName: "",
      manualPaymentWhatsapp: "",
      midtransIsProduction: false,
    },
  });

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .eq('id', 'global') // Assuming 'global' is the ID for the single settings row
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116: "Searched item was not found" (can happen on first load)
        console.error("Error fetching admin settings:", error);
        toast({ title: "Gagal Memuat Pengaturan", description: error.message, variant: "destructive" });
      } else if (data) {
        form.reset({
          siteName: data.site_name || "",
          defaultEventImageUrl: data.default_event_image_url || "",
          contactEmail: data.contact_email || "",
          metaPixelId: data.meta_pixel_id || "",
          googleAnalyticsId: data.google_analytics_id || "",
          manualPaymentBankName: data.manual_payment_bank_name || "",
          manualPaymentAccountNumber: data.manual_payment_account_number || "",
          manualPaymentAccountHolderName: data.manual_payment_account_holder_name || "",
          manualPaymentWhatsapp: data.manual_payment_whatsapp || "",
          midtransIsProduction: data.midtrans_is_production || false,
        });
      }
      setIsLoading(false);
    };
    fetchSettings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(values: AdminSettingsFormValues) {
    startTransition(async () => {
      const updateData = {
        site_name: values.siteName,
        default_event_image_url: values.defaultEventImageUrl,
        contact_email: values.contactEmail,
        meta_pixel_id: values.metaPixelId,
        google_analytics_id: values.googleAnalyticsId,
        manual_payment_bank_name: values.manualPaymentBankName,
        manual_payment_account_number: values.manualPaymentAccountNumber,
        manual_payment_account_holder_name: values.manualPaymentAccountHolderName,
        manual_payment_whatsapp: values.manualPaymentWhatsapp,
        midtrans_is_production: values.midtransIsProduction,
        updated_at: new Date().toISOString(), // Manually set updated_at
      };

      const { error } = await supabase
        .from('admin_settings')
        .update(updateData)
        .eq('id', 'global'); // Update the 'global' settings row

      if (error) {
        toast({ title: "Gagal Menyimpan Pengaturan", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Pengaturan Disimpan", description: "Pengaturan admin telah berhasil diperbarui di database." });
      }
    });
  }

  if (isLoading) {
    return (
      <div className="container flex min-h-[calc(100vh-10rem)] items-center justify-center py-12">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" /> Memuat pengaturan admin...
      </div>
    );
  }

  return (
    <div className="container py-12 space-y-8">
      <Card className="mx-auto max-w-3xl shadow-xl">
        <CardHeader className="bg-primary text-primary-foreground p-6 rounded-t-lg">
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="h-10 w-10" />
            <div>
              <CardTitle className="text-3xl font-bold">Pengaturan Admin</CardTitle>
              <CardDescription className="text-primary-foreground/80">
                Konfigurasi pengaturan umum untuk platform Bproid.com.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Pengaturan Umum Situs */}
          <Card className="mx-auto max-w-3xl shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-xl"><Globe className="mr-2 h-6 w-6 text-accent" />Pengaturan Umum Situs</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <FormField
                control={form.control}
                name="siteName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Situs</FormLabel>
                    <FormControl><Input placeholder="Nama situs Anda" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Kontak Utama</FormLabel>
                    <FormControl><Input type="email" placeholder="admin@example.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="defaultEventImageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL Gambar Default Acara (Opsional)</FormLabel>
                    <FormControl><Input placeholder="https://example.com/default-event.jpg" {...field} /></FormControl>
                    <FormDescription>URL gambar yang digunakan jika acara tidak memiliki gambar sendiri.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Pengaturan Midtrans */}
          <Card className="mx-auto max-w-3xl shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-xl"><CreditCard className="mr-2 h-6 w-6 text-accent" />Pengaturan Midtrans</CardTitle>
              <CardDescription>Konfigurasi mode environment Midtrans Anda.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label>Midtrans Client Key (Frontend)</Label>
                <Input readOnly value={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "Belum diatur di .env"} />
                <FormDescription>Diambil dari variabel environment `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`.</FormDescription>
              </div>
               <div className="space-y-2">
                <Label>Midtrans Snap JS URL (Frontend)</Label>
                <Input readOnly value={process.env.NEXT_PUBLIC_MIDTRANS_SNAP_JS_URL || "Belum diatur di .env"} />
                <FormDescription>Diambil dari variabel environment `NEXT_PUBLIC_MIDTRANS_SNAP_JS_URL`.</FormDescription>
              </div>
              <div className="space-y-2">
                <Label>Midtrans Server Key (Backend)</Label>
                 <div className="p-3 bg-muted rounded-md text-sm text-muted-foreground">
                  <Info className="inline h-4 w-4 mr-1" />
                  Midtrans Server Key dikelola sebagai environment variable (secret) di pengaturan Supabase Edge Function Anda. Ini tidak diatur melalui halaman ini untuk keamanan.
                </div>
              </div>
              <FormField
                control={form.control}
                name="midtransIsProduction"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Mode Produksi Midtrans</FormLabel>
                      <FormDescription>
                        Aktifkan jika Anda menggunakan akun Midtrans Produksi. Nonaktifkan untuk Sandbox.
                        Pengaturan ini akan disimpan di database dan dapat diakses oleh Edge Functions jika dirancang demikian.
                        Saat ini, Edge Functions menggunakan `DENO_ENV_MIDTRANS_IS_PRODUCTION`.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Pelacakan & Analitik */}
          <Card className="mx-auto max-w-3xl shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-xl"><BarChart2 className="mr-2 h-6 w-6 text-accent" />Pelacakan & Analitik</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <FormField
                control={form.control}
                name="metaPixelId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID Meta Pixel (Opsional)</FormLabel>
                    <FormControl><Input placeholder="Masukkan ID Meta Pixel Anda" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="googleAnalyticsId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID Google Analytics (Opsional)</FormLabel>
                    <FormControl><Input placeholder="Masukkan ID Google Analytics Anda (mis., G-XXXXXXXXXX)" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Pengaturan Pembayaran Manual */}
          <Card className="mx-auto max-w-3xl shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-xl"><Banknote className="mr-2 h-6 w-6 text-accent" />Pengaturan Pembayaran Manual (Transfer Bank)</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <FormField
                control={form.control}
                name="manualPaymentBankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Bank</FormLabel>
                    <FormControl><Input placeholder="mis., Bank Central Asia (BCA)" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="manualPaymentAccountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nomor Rekening</FormLabel>
                    <FormControl><Input placeholder="mis., 1234567890" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="manualPaymentAccountHolderName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Pemilik Rekening</FormLabel>
                    <FormControl><Input placeholder="mis., PT Tiket Sukses Bersama" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="manualPaymentWhatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nomor WhatsApp Konfirmasi (Opsional)</FormLabel>
                    <FormControl><Input placeholder="mis., +6281234567890" {...field} /></FormControl>
                    <FormDescription>Nomor ini akan ditampilkan kepada pengguna untuk konfirmasi pembayaran manual.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isPending || isLoading} className="bg-primary hover:bg-primary/90 min-w-[150px]">
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Simpan Semua Pengaturan
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
