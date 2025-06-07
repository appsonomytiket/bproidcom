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
import { BadgePercent, Check, Edit3, Loader2 } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useTransition, useState } from "react";
import { formatISO, parseISO } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { createBrowserClient } from '@supabase/ssr';
import type { Coupon as CouponType } from "@/lib/types"; // Ensure this type matches DB structure

const editCouponFormSchema = z.object({
  code: z.string().min(3, { message: "Kode kupon minimal 3 karakter." }).max(20, { message: "Kode kupon maksimal 20 karakter."}).regex(/^[a-zA-Z0-9]+$/, { message: "Kode kupon hanya boleh berisi huruf dan angka."}).transform(val => val.toUpperCase()),
  description: z.string().max(100, { message: "Deskripsi maksimal 100 karakter."}).optional(),
  discount_type: z.enum(['percentage', 'fixed_amount'], { required_error: "Tipe diskon harus dipilih."}), // Match DB enum
  discount_value: z.coerce.number().min(1, { message: "Nilai diskon minimal 1." }),
  expires_at: z.date().nullable().optional(), // Allow null for no expiry
  is_active: z.boolean().default(true),
  max_uses: z.coerce.number().min(0, { message: "Batas penggunaan tidak boleh negatif." }).nullable().optional(),
  min_purchase_amount: z.coerce.number().min(0, { message: "Minimal pembelian tidak boleh negatif." }).nullable().optional(),
  // applicable_event_ids: z.array(z.string()).optional(), // If you implement event-specific coupons
}).refine(data => {
    if (data.discount_type === 'percentage' && data.discount_value > 100) {
        return false;
    }
    return true;
}, {
    message: "Diskon persentase tidak boleh lebih dari 100%.",
    path: ["discount_value"],
});

type EditCouponFormValues = z.infer<typeof editCouponFormSchema>;

export default function EditCouponPage() {
  const router = useRouter();
  const params = useParams();
  const couponId = params.id as string;
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isLoadingCoupon, setIsLoadingCoupon] = useState(true);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const form = useForm<EditCouponFormValues>({
    resolver: zodResolver(editCouponFormSchema),
    defaultValues: {
      code: "",
      description: "",
      discount_type: "percentage",
      discount_value: 10,
      expires_at: null,
      is_active: true,
      max_uses: null, 
      min_purchase_amount: null,
    },
  });

  useEffect(() => {
    if (!couponId) return;

    const fetchCouponData = async () => {
      setIsLoadingCoupon(true);
      const { data: couponData, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("id", couponId)
        .single();

      if (error || !couponData) {
        toast({
          title: "Gagal Memuat Kupon",
          description: error?.message || "Kupon tidak ditemukan.",
          variant: "destructive",
        });
        router.push("/dashboard/admin/coupons");
        return;
      }
      
      form.reset({
        code: couponData.code,
        description: couponData.description || "",
        discount_type: couponData.discount_type as 'percentage' | 'fixed_amount',
        discount_value: couponData.discount_value,
        expires_at: couponData.expires_at ? parseISO(couponData.expires_at) : null,
        is_active: couponData.is_active,
        max_uses: couponData.max_uses,
        min_purchase_amount: couponData.min_purchase_amount,
      });
      setIsLoadingCoupon(false);
    };

    fetchCouponData();
  }, [couponId, supabase, form, router, toast]);

  async function onSubmit(values: EditCouponFormValues) {
    startTransition(async () => {
      const couponToUpdate = {
        coupon_id: couponId,
        code: values.code,
        description: values.description || null,
        discount_type: values.discount_type,
        discount_value: values.discount_value,
        expires_at: values.expires_at ? formatISO(values.expires_at) : null,
        is_active: values.is_active,
        max_uses: values.max_uses,
        min_purchase_amount: values.min_purchase_amount,
        // applicable_event_ids: values.applicable_event_ids, // If implemented
      };

      try {
        const { data, error } = await supabase.functions.invoke('update-coupon', {
            body: couponToUpdate,
        });

        if (error) throw error;
        
        const updatedCouponCode = (data as any)?.coupon?.code || values.code;

        toast({
          title: "Kupon Diperbarui",
          description: `Kupon ${updatedCouponCode} telah berhasil diperbarui.`,
          action: <Check className="h-5 w-5 text-green-500" />,
        });
        router.push("/dashboard/admin/coupons");
      } catch (error: any) {
        console.error("Gagal memperbarui kupon:", error);
        toast({
          title: "Gagal Memperbarui Kupon",
          description: error.message || "Terjadi masalah saat memperbarui kupon.",
          variant: "destructive",
        });
      }
    });
  }
  
  if (isLoadingCoupon) {
    return (
      <div className="container flex min-h-[calc(100vh-10rem)] items-center justify-center py-12 text-center">
        <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
        <p className="text-xl font-semibold">Memuat detail kupon...</p>
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
              <CardTitle className="text-3xl font-bold">Edit Kupon</CardTitle>
              <CardDescription className="text-primary-foreground/80">
                Perbarui detail kupon di bawah ini.
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
                      <Textarea placeholder="Deskripsi singkat tentang kupon..." {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="discount_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipe Diskon</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih tipe diskon" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="percentage">Persentase (%)</SelectItem>
                          <SelectItem value="fixed_amount">Jumlah Tetap (Rp)</SelectItem> {/* Value matches DB */}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="discount_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nilai Diskon</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder={form.getValues("discount_type") === "percentage" ? "Contoh: 20 (untuk 20%)" : "Contoh: 50000 (untuk Rp 50.000)"} {...field} />
                      </FormControl>
                       <FormDescription>{form.getValues("discount_type") === "percentage" ? "Persentase (1-100)" : "Jumlah dalam Rupiah"}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="expires_at"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Tanggal Kedaluwarsa (Opsional)</FormLabel>
                    <DatePicker 
                      date={field.value === null ? undefined : field.value} // Convert null to undefined
                      setDate={field.onChange} 
                      disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                    />
                    <FormDescription>Kosongkan jika tidak ada tanggal kedaluwarsa.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="min_purchase_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimal Pembelian (Rp, Opsional)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0 jika tidak ada" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormDescription>Isi 0 atau kosongkan jika tidak ada minimal pembelian.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="max_uses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Batas Penggunaan (Opsional)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0 untuk tak terbatas" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormDescription>Berapa kali kupon ini bisa digunakan. Isi 0 atau kosongkan untuk tak terbatas.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="is_active"
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

              <Button type="submit" disabled={isPending || isLoadingCoupon} className="w-full bg-accent hover:bg-accent/90">
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Simpan Perubahan Kupon
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
