
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
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SlidersHorizontal, BarChart2, Banknote, Save, Loader2, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useTransition } from "react"; 
import { LOCAL_STORAGE_ANALYTICS_KEY, LOCAL_STORAGE_PAYMENT_KEY, LOCAL_STORAGE_MIDTRANS_KEY } from "@/lib/constants";

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

const midtransFormSchema = z.object({
  midtransClientKey: z.string().min(1, { message: "Client Key Midtrans harus diisi."}),
  midtransServerKey: z.string().min(1, { message: "Server Key Midtrans harus diisi."}),
  isProduction: z.boolean().default(false),
});
type MidtransFormValues = z.infer<typeof midtransFormSchema>;

const initialAnalyticsDefaultValues: AnalyticsFormValues = { metaPixelId: "", googleAnalyticsId: "" };
const initialPaymentDefaultValues: PaymentFormValues = { bankName: "", accountNumber: "", accountHolderName: "", whatsappConfirmationNumber: "" };
const initialMidtransDefaultValues: MidtransFormValues = { midtransClientKey: "", midtransServerKey: "", isProduction: false };


export default function SettingsPage() {
  const { toast } = useToast();
  const [isAnalyticsPending, startAnalyticsTransition] = useTransition();
  const [isPaymentPending, startPaymentTransition] = useTransition();
  const [isMidtransPending, startMidtransTransition] = useTransition();

  const analyticsForm = useForm<AnalyticsFormValues>({
    resolver: zodResolver(analyticsFormSchema),
    defaultValues: initialAnalyticsDefaultValues,
  });

  const paymentForm = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: initialPaymentDefaultValues,
  });

  const midtransForm = useForm<MidtransFormValues>({
    resolver: zodResolver(midtransFormSchema),
    defaultValues: initialMidtransDefaultValues,
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedAnalyticsSettings = localStorage.getItem(LOCAL_STORAGE_ANALYTICS_KEY);
      if (storedAnalyticsSettings) {
        try {
          analyticsForm.reset(JSON.parse(storedAnalyticsSettings));
        } catch (e) {
          console.error("Gagal mem-parse pengaturan analitik dari localStorage:", e);
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
      
      const storedMidtransSettings = localStorage.getItem(LOCAL_STORAGE_MIDTRANS_KEY);
      if (storedMidtransSettings) {
        try {
          midtransForm.reset(JSON.parse(storedMidtransSettings));
        } catch (e) {
          console.error("Gagal mem-parse pengaturan Midtrans dari localStorage:", e);
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 


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
  
  function onMidtransSubmit(values: MidtransFormValues) {
    startMidtransTransition(() => {
      console.log("Pengaturan Midtrans:", values);
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_MIDTRANS_KEY, JSON.stringify(values));
      }
      toast({
        title: "Pengaturan Midtrans Disimpan",
        description: "Kredensial Midtrans telah diperbarui (secara lokal). Ingat, untuk produksi, Server Key harus diatur di environment Supabase Function.",
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
      </Card>

      {/* Pengaturan Midtrans */}
      <Card className="mx-auto max-w-3xl shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-xl"><CreditCard className="mr-2 h-6 w-6 text-accent" />Pengaturan Midtrans</CardTitle>
          <CardDescription>Konfigurasi Client Key, Server Key, dan mode environment Midtrans Anda. Server Key sebaiknya diatur sebagai secret di Supabase Edge Function Anda untuk produksi.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...midtransForm}>
            <form onSubmit={midtransForm.handleSubmit(onMidtransSubmit)} className="space-y-6">
              <FormField
                control={midtransForm.control}
                name="midtransClientKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Midtrans Client Key</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Masukkan Client Key Midtrans Anda" {...field} />
                    </FormControl>
                    <FormDescription>Digunakan di sisi frontend untuk Midtrans Snap.js.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={midtransForm.control}
                name="midtransServerKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Midtrans Server Key</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Masukkan Server Key Midtrans Anda" {...field} />
                    </FormControl>
                    <FormDescription>Digunakan di sisi backend (Supabase Function) untuk otentikasi API. Jaga kerahasiaannya.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={midtransForm.control}
                name="isProduction"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Mode Produksi Midtrans</FormLabel>
                      <FormDescription>
                        Aktifkan jika Anda menggunakan akun Midtrans Produksi. Nonaktifkan untuk Sandbox.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isMidtransPending} className="bg-primary hover:bg-primary/90">
                {isMidtransPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Simpan Pengaturan Midtrans
              </Button>
            </form>
          </Form>
        </CardContent>
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
