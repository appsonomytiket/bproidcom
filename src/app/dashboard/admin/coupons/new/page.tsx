
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
import { BadgePercent, Check, Loader2, PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useState, useTransition } from "react";
import { formatISO } from "date-fns";
import type { Coupon } from "@/lib/types";
import { LOCAL_STORAGE_COUPONS_KEY, MOCK_COUPONS } from "@/lib/constants";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const addCouponFormSchema = z.object({
  code: z.string().min(3, { message: "Kode kupon minimal 3 karakter." }).max(20, { message: "Kode kupon maksimal 20 karakter."}).regex(/^[a-zA-Z0-9]+$/, { message: "Kode kupon hanya boleh berisi huruf dan angka."}).transform(val => val.toUpperCase()),
  description: z.string().max(100, { message: "Deskripsi maksimal 100 karakter."}).optional(),
  discountType: z.enum(['percentage', 'fixed'], { required_error: "Tipe diskon harus dipilih."}),
  discountValue: z.coerce.number().min(1, { message: "Nilai diskon minimal 1." }),
  expiryDate: z.date({ required_error: "Tanggal kedaluwarsa harus diisi." }),
  isActive: z.boolean().default(true),
  usageLimit: z.coerce.number().min(0, { message: "Batas penggunaan tidak boleh negatif." }).optional(),
  minPurchase: z.coerce.number().min(0, { message: "Minimal pembelian tidak boleh negatif." }).optional(),
}).refine(data => {
    if (data.discountType === 'percentage' && data.discountValue > 100) {
        return false;
    }
    return true;
}, {
    message: "Diskon persentase tidak boleh lebih dari 100%.",
    path: ["discountValue"],
});

type AddCouponFormValues = z.infer<typeof addCouponFormSchema>;

export default function AddCouponPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<AddCouponFormValues>({
    resolver: zodResolver(addCouponFormSchema),
    defaultValues: {
      code: "",
      description: "",
      discountType: "percentage",
      discountValue: 10,
      isActive: true,
      usageLimit: 0, // 0 for unlimited by default, or let user specify
      minPurchase: 0,
    },
  });

  function onSubmit(values: AddCouponFormValues) {
    startTransition(async () => {
      const newCouponId = `CPN-${Date.now().toString().slice(-5)}`;
      const newCoupon: Coupon = {
        id: newCouponId,
        code: values.code,
        description: values.description || "",
        discountType: values.discountType,
        discountValue: values.discountValue,
        expiryDate: formatISO(values.expiryDate),
        isActive: values.isActive,
        usageLimit: values.usageLimit === 0 ? undefined : values.usageLimit, // Store as undefined if 0
        timesUsed: 0,
        minPurchase: values.minPurchase === 0 ? undefined : values.minPurchase, // Store as undefined if 0
      };

      try {
        const storedCouponsString = localStorage.getItem(LOCAL_STORAGE_COUPONS_KEY);
        let allCoupons: Coupon[] = [];
        if (storedCouponsString) {
          allCoupons = JSON.parse(storedCouponsString);
        } else {
          // If localStorage is empty, initialize with MOCK_COUPONS (optional, or start fresh)
           allCoupons = MOCK_COUPONS; // Or [] to start completely fresh
        }
        
        // Check for duplicate coupon code
        if (allCoupons.some(coupon => coupon.code === newCoupon.code)) {
            toast({
                title: "Kode Kupon Duplikat",
                description: `Kupon dengan kode "${newCoupon.code}" sudah ada.`,
                variant: "destructive",
            });
            return; // Stop submission
        }

        const updatedCoupons = [...allCoupons, newCoupon];
        localStorage.setItem(LOCAL_STORAGE_COUPONS_KEY, JSON.stringify(updatedCoupons));
        
        toast({
          title: "Kupon Ditambahkan",
          description: `Kupon ${values.code} telah berhasil ditambahkan.`,
          action: <Check className="h-5 w-5 text-green-500" />,
        });

        router.push("/dashboard/admin/coupons");

      } catch (error) {
        console.error("Gagal menyimpan kupon ke localStorage:", error);
        toast({
          title: "Gagal Menyimpan Kupon",
          description: "Terjadi masalah saat menyimpan kupon.",
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
            <BadgePercent className="h-10 w-10" />
            <div>
              <CardTitle className="text-3xl font-bold">Tambah Kupon Baru</CardTitle>
              <CardDescription className="text-primary-foreground/80">
                Isi detail kupon di bawah ini.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kode Kupon</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: HEMAT25" {...field} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                    </FormControl>
                    <FormDescription>Kode unik untuk kupon (huruf dan angka, akan diubah ke huruf besar).</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deskripsi Kupon (Opsional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Deskripsi singkat tentang kupon..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="discountType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipe Diskon</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih tipe diskon" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="percentage">Persentase (%)</SelectItem>
                          <SelectItem value="fixed">Jumlah Tetap (Rp)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="discountValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nilai Diskon</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder={form.getValues("discountType") === "percentage" ? "Contoh: 20 (untuk 20%)" : "Contoh: 50000 (untuk Rp 50.000)"} {...field} />
                      </FormControl>
                       <FormDescription>{form.getValues("discountType") === "percentage" ? "Persentase (1-100)" : "Jumlah dalam Rupiah"}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="expiryDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Tanggal Kedaluwarsa</FormLabel>
                    <DatePicker 
                      date={field.value} 
                      setDate={field.onChange} 
                      disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="minPurchase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimal Pembelian (Rp, Opsional)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Contoh: 100000 (0 jika tidak ada)" {...field} />
                      </FormControl>
                      <FormDescription>Isi 0 jika tidak ada minimal pembelian.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="usageLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Batas Penggunaan (Opsional)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Contoh: 100 (0 untuk tak terbatas)" {...field} />
                      </FormControl>
                      <FormDescription>Berapa kali kupon ini bisa digunakan. Isi 0 untuk tak terbatas.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Aktifkan Kupon</FormLabel>
                      <FormDescription>
                        Jika aktif, kupon dapat digunakan oleh pelanggan.
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


              <Button type="submit" disabled={isPending} className="w-full bg-accent hover:bg-accent/90">
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <PlusCircle className="mr-2 h-4 w-4" />
                )}
                Simpan Kupon
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
