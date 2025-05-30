
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SlidersHorizontal, BarChart2, Banknote, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useTransition } from "react"; // Added useEffect

const analyticsFormSchema = z.object({
  metaPixelId: z.string().optional(),
  googleAnalyticsId: z.string().optional(),
});

type AnalyticsFormValues = z.infer<typeof analyticsFormSchema>;

const paymentFormSchema = z.object({
  bankName: z.string().min(1, { message: "Nama bank harus diisi." }),
  accountNumber: z.string().min(1, { message: "Nomor rekening harus diisi." }).regex(/^\d+$/, { message: "Nomor rekening hanya boleh berisi angka."}),
  accountHolderName: z.string().min(1, { message: "Nama pemilik rekening harus diisi." }),
  whatsappConfirmationNumber: z.string().optional().refine(val => !val || /^\+?\d+$/.test(val), {
    message: "Nomor WhatsApp tidak valid (contoh: +6281234567890).",
  }),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

const LOCAL_STORAGE_ANALYTICS_KEY = 'bproid_admin_analytics_settings';
const LOCAL_STORAGE_PAYMENT_KEY = 'bproid_admin_payment_settings';

// Static initial default values
const initialAnalyticsDefaultValues: AnalyticsFormValues = { metaPixelId: "", googleAnalyticsId: "" };
const initialPaymentDefaultValues: PaymentFormValues = { bankName: "", accountNumber: "", accountHolderName: "", whatsappConfirmationNumber: "" };


export default function SettingsPage() {
  const { toast } = useToast();
  const [isAnalyticsPending, startAnalyticsTransition] = useTransition();
  const [isPaymentPending, startPaymentTransition] = useTransition();

  const analyticsForm = useForm<AnalyticsFormValues>({
    resolver: zodResolver(analyticsFormSchema),
    defaultValues: initialAnalyticsDefaultValues, // Use static initial values
  });

  const paymentForm = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: initialPaymentDefaultValues, // Use static initial values
  });

  // Load values from localStorage in useEffect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedAnalyticsSettings = localStorage.getItem(LOCAL_STORAGE_ANALYTICS_KEY);
      if (storedAnalyticsSettings) {
        try {
          analyticsForm.reset(JSON.parse(storedAnalyticsSettings));
        } catch (e) {
          console.error("Gagal mem-parse pengaturan analitik dari localStorage:", e);
          // Optionally reset to initial defaults or notify user
        }
      }

      const storedPaymentSettings = localStorage.getItem(LOCAL_STORAGE_PAYMENT_KEY);
      if (storedPaymentSettings) {
        try {
          paymentForm.reset(JSON.parse(storedPaymentSettings));
        } catch (e) {
          console.error("Gagal mem-parse pengaturan pembayaran dari localStorage:", e);
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this runs once on mount. analyticsForm and paymentForm are stable.


  function onAnalyticsSubmit(values: AnalyticsFormValues) {
    startAnalyticsTransition(() => {
      console.log("Pengaturan Analitik:", values);
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_ANALYTICS_KEY, JSON.stringify(values));
      }
      toast({
        title: "Pengaturan Analitik Disimpan",
        description: "ID Meta Pixel dan Google Analytics telah diperbarui (secara lokal).",
      });
    });
  }

  function onPaymentSubmit(values: PaymentFormValues) {
    startPaymentTransition(() => {
      console.log("Pengaturan Pembayaran:", values);
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_PAYMENT_KEY, JSON.stringify(values));
      }
      toast({
        title: "Pengaturan Pembayaran Disimpan",
        description: "Detail rekening bank dan nomor WhatsApp telah diperbarui (secara lokal).",
      });
    });
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
        {/* Konten pengaturan akan ditambahkan di sini - sudah dipindah ke Card terpisah */}
      </Card>

      {/* Pelacakan & Analitik */}
      <Card className="mx-auto max-w-3xl shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-xl"><BarChart2 className="mr-2 h-6 w-6 text-accent" />Pelacakan & Analitik</CardTitle>
          <CardDescription>Konfigurasi kode pelacakan Meta Pixel dan Google Analytics Anda.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...analyticsForm}>
            <form onSubmit={analyticsForm.handleSubmit(onAnalyticsSubmit)} className="space-y-6">
              <FormField
                control={analyticsForm.control}
                name="metaPixelId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID Meta Pixel</FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan ID Meta Pixel Anda" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={analyticsForm.control}
                name="googleAnalyticsId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID Google Analytics</FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan ID Google Analytics Anda (mis., G-XXXXXXXXXX)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isAnalyticsPending} className="bg-primary hover:bg-primary/90">
                {isAnalyticsPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Simpan Pengaturan Analitik
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Pengaturan Pembayaran Manual */}
      <Card className="mx-auto max-w-3xl shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-xl"><Banknote className="mr-2 h-6 w-6 text-accent" />Pengaturan Pembayaran Manual (Transfer Bank)</CardTitle>
          <CardDescription>Konfigurasi detail rekening bank untuk menerima pembayaran manual melalui transfer.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...paymentForm}>
            <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)} className="space-y-6">
              <FormField
                control={paymentForm.control}
                name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Bank</FormLabel>
                    <FormControl>
                      <Input placeholder="mis., Bank Central Asia (BCA)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={paymentForm.control}
                name="accountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nomor Rekening</FormLabel>
                    <FormControl>
                      <Input placeholder="mis., 1234567890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={paymentForm.control}
                name="accountHolderName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Pemilik Rekening</FormLabel>
                    <FormControl>
                      <Input placeholder="mis., PT Tiket Sukses Bersama" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={paymentForm.control}
                name="whatsappConfirmationNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nomor WhatsApp Konfirmasi</FormLabel>
                    <FormControl>
                      <Input placeholder="mis., +6281234567890" {...field} />
                    </FormControl>
                    <FormDescription>Nomor ini akan ditampilkan kepada pengguna untuk konfirmasi pembayaran.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isPaymentPending} className="bg-primary hover:bg-primary/90">
                 {isPaymentPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Simpan Pengaturan Bank
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
