
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";
import type { Event, EventPriceTier, Coupon } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Ticket, User, Mail, Tag, Percent, CheckCircle, Loader2, CreditCard } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { supabase } from "@/lib/supabaseClient";
import { parseISO } from "date-fns";

// Script tag for Midtrans Snap.js - to be added in _document.tsx or RootLayout if not already present
// For this component, we'll assume it's globally available.
declare global {
  interface Window {
    snap: any; // Midtrans Snap.js will attach itself to window.snap
  }
}

const bookingFormSchema = z.object({
  name: z.string().min(2, { message: "Nama minimal 2 karakter." }),
  email: z.string().email({ message: "Alamat email tidak valid." }),
  selectedTierName: z.string().min(1, { message: "Pilih jenis tiket." }),
  tickets: z.coerce.number().min(1, { message: "Minimal pesan 1 tiket." }).max(10, { message: "Tidak dapat memesan lebih dari 10 tiket sekaligus."}),
  couponCode: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

interface BookingFormProps {
  event: Event;
}

export function BookingForm({ event }: BookingFormProps) {
  const router = useRouter();
  const searchParamsHook = useSearchParams();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [selectedTier, setSelectedTier] = useState<EventPriceTier | undefined>(
    event.priceTiers && event.priceTiers.length > 0 ? event.priceTiers[0] : undefined
  );
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [couponInput, setCouponInput] = useState<string>("");

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      name: "",
      email: "",
      selectedTierName: selectedTier?.name || "",
      tickets: 1,
      couponCode: "",
    },
  });

  useEffect(() => {
    // Load Midtrans Snap.js script
    const script = document.createElement('script');
    script.src = process.env.NEXT_PUBLIC_MIDTRANS_SNAP_JS_URL || "https://app.sandbox.midtrans.com/snap/snap.js"; // Use sandbox for dev, production for live
    script.setAttribute('data-client-key', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "");
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    }
  }, []);


  useEffect(() => {
    if (event.priceTiers && event.priceTiers.length > 0 && !form.getValues("selectedTierName")) {
      const defaultTier = event.priceTiers[0];
      form.setValue("selectedTierName", defaultTier.name);
      setSelectedTier(defaultTier);
    }
  }, [event.priceTiers, form]);
  

  const currentTickets = form.watch("tickets");
  const currentSelectedTierName = form.watch("selectedTierName");

  useEffect(() => {
    const tier = event.priceTiers.find(t => t.name === currentSelectedTierName);
    setSelectedTier(tier);
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponInput("");
    form.setValue("couponCode", "");
  }, [currentSelectedTierName, currentTickets, event.priceTiers, form]);

  const subtotalPrice = selectedTier ? currentTickets * selectedTier.price : 0;
  const finalTotalPrice = subtotalPrice - discountAmount;

  const handleApplyCoupon = async () => {
    // ... (Coupon logic remains largely the same, fetching from Supabase)
    if (!couponInput.trim()) {
      toast({ title: "Kode Kupon Kosong", description: "Silakan masukkan kode kupon.", variant: "destructive" });
      return;
    }
    if (!selectedTier) {
      toast({ title: "Tier Belum Dipilih", description: "Silakan pilih jenis tiket terlebih dahulu.", variant: "destructive" });
      return;
    }

    const { data: couponToApply, error: couponFetchError } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponInput.toUpperCase())
      .single();

    if (couponFetchError || !couponToApply) {
      toast({ title: "Kupon Tidak Valid", description: "Kode kupon tidak ditemukan atau terjadi kesalahan.", variant: "destructive" });
      setAppliedCoupon(null); setDiscountAmount(0);
      return;
    }
    if (!couponToApply.is_active) {
      toast({ title: "Kupon Tidak Aktif", description: "Kupon ini sudah tidak aktif.", variant: "destructive" });
      setAppliedCoupon(null); setDiscountAmount(0);
      return;
    }
    if (parseISO(couponToApply.expiry_date) < new Date()) {
      toast({ title: "Kupon Kedaluwarsa", description: "Kupon ini sudah kedaluwarsa.", variant: "destructive" });
      setAppliedCoupon(null); setDiscountAmount(0);
      return;
    }
    if (couponToApply.min_purchase && subtotalPrice < couponToApply.min_purchase) {
      toast({ title: "Minimal Pembelian", description: `Minimal pembelian untuk kupon ini adalah Rp ${couponToApply.min_purchase.toLocaleString()}.`, variant: "destructive" });
      setAppliedCoupon(null); setDiscountAmount(0);
      return;
    }
    if (couponToApply.usage_limit && couponToApply.times_used >= couponToApply.usage_limit) {
      toast({ title: "Batas Penggunaan Kupon", description: "Kupon ini telah mencapai batas penggunaan.", variant: "destructive" });
      setAppliedCoupon(null); setDiscountAmount(0);
      return;
    }

    let calculatedDiscount = 0;
    if (couponToApply.discount_type === 'percentage') {
      calculatedDiscount = (subtotalPrice * couponToApply.discount_value) / 100;
    } else {
      calculatedDiscount = couponToApply.discount_value;
    }
    calculatedDiscount = Math.min(calculatedDiscount, subtotalPrice); 

    setAppliedCoupon(couponToApply as unknown as Coupon);
    setDiscountAmount(calculatedDiscount);
    form.setValue("couponCode", couponToApply.code);
    toast({ title: "Kupon Diterapkan!", description: `Anda mendapat diskon Rp ${calculatedDiscount.toLocaleString()}.` });
  };


  async function onSubmit(values: BookingFormValues) {
    if (!selectedTier) {
      toast({ title: "Kesalahan Pemesanan", description: "Tier tiket tidak valid.", variant: "destructive" });
      return;
    }
    if (!window.snap) {
        toast({ title: "Kesalahan Pembayaran", description: "Layanan pembayaran tidak tersedia saat ini. Mohon coba lagi nanti.", variant: "destructive" });
        return;
    }
    
    setIsPaymentProcessing(true);
    startTransition(async () => {
      let userId;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
      }

      const usedReferralCode = searchParamsHook.get('ref') || undefined;

      const paymentPayload = {
        event_id: event.id,
        user_id: userId,
        num_tickets: values.tickets,
        selected_tier_name: selectedTier.name,
        coupon_code: appliedCoupon ? appliedCoupon.code : undefined,
        user_name: values.name,
        user_email: values.email,
        used_referral_code: usedReferralCode,
        // final_total_price: finalTotalPrice, // The Edge Function will recalculate this securely
      };

      try {
        // Panggil Edge Function untuk initiate payment dan mendapatkan Midtrans token
        const { data: paymentResponse, error: paymentError } = await supabase.functions.invoke(
          'initiate-payment', // Ganti nama fungsi jika berbeda
          { body: paymentPayload }
        );

        if (paymentError || paymentResponse.error) {
          console.error("Payment initiation error:", paymentError || paymentResponse.error);
          throw new Error(paymentError?.message || paymentResponse?.error || 'Gagal memulai pembayaran.');
        }
        
        const midtransToken = paymentResponse.midtrans_token;
        if (!midtransToken) {
            throw new Error('Token pembayaran Midtrans tidak diterima.');
        }

        // Gunakan Midtrans Snap.js untuk menampilkan popup pembayaran
        window.snap.pay(midtransToken, {
          onSuccess: function(result: any){
            console.log('Payment Success:', result);
            toast({
              title: "Pembayaran Berhasil!",
              description: "E-tiket Anda akan segera dikirimkan melalui email.",
            });
            // Simpan detail dasar untuk halaman konfirmasi sederhana atau pengalihan
             if (typeof window !== 'undefined') {
              localStorage.setItem('bookingDetails', JSON.stringify({
                bookingId: result.order_id, // order_id dari Midtrans harusnya booking_id kita
                eventName: event.name,
                name: values.name,
                email: values.email,
                tickets: values.tickets,
                totalPrice: finalTotalPrice, // Atau ambil dari result jika ada
                paymentStatus: 'paid',
              }));
            }
            router.push(`/booking/confirmation/${result.order_id}?status=success`);
            setIsPaymentProcessing(false);
          },
          onPending: function(result: any){
            console.log('Payment Pending:', result);
            toast({
              title: "Pembayaran Tertunda",
              description: "Selesaikan pembayaran Anda. Cek email untuk instruksi lebih lanjut.",
              duration: 5000,
            });
             if (typeof window !== 'undefined') {
               localStorage.setItem('bookingDetails', JSON.stringify({
                bookingId: result.order_id,
                eventName: event.name,
                name: values.name,
                email: values.email,
                tickets: values.tickets,
                totalPrice: finalTotalPrice,
                paymentStatus: 'pending',
              }));
            }
            router.push(`/booking/confirmation/${result.order_id}?status=pending`);
            setIsPaymentProcessing(false);
          },
          onError: function(result: any){
            console.error('Payment Error:', result);
            toast({
              title: "Pembayaran Gagal",
              description: "Terjadi kesalahan saat memproses pembayaran. Silakan coba lagi.",
              variant: "destructive",
            });
            setIsPaymentProcessing(false);
          },
          onClose: function(){
            console.log('Payment popup closed');
            // Jika user menutup popup sebelum pembayaran selesai
            // Jangan tampilkan toast error kecuali benar-benar error dari Midtrans
            if (!isPaymentProcessing) { // Check jika bukan karena error/success/pending
                 toast({
                    title: "Pembayaran Dibatalkan",
                    description: "Anda menutup jendela pembayaran.",
                    variant: "default", // atau "destructive" jika dianggap penting
                    duration: 3000
                });
            }
            setIsPaymentProcessing(false); // Selalu set false di onClose
          }
        });
        // Tidak perlu setIsPaymentProcessing(false) di sini karena snap.pay bersifat async dan callback akan menanganinya

      } catch (error: any) {
        toast({
          title: "Gagal Memproses Pembayaran",
          description: error.message || "Terjadi masalah saat menghubungi server.",
          variant: "destructive",
        });
        setIsPaymentProcessing(false);
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 rounded-lg border bg-card p-6 shadow-md">
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

        {event.priceTiers && event.priceTiers.length > 0 && (
          <FormField
            control={form.control}
            name="selectedTierName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center"><Tag className="mr-2 h-4 w-4 text-primary" />Jenis Tiket</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis tiket" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {event.priceTiers.map((tier) => (
                      <SelectItem key={tier.name} value={tier.name}>
                        {tier.name} (Rp {tier.price.toLocaleString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="tickets"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><Ticket className="mr-2 h-4 w-4 text-primary" />Jumlah Tiket</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min="1" 
                  max={event.availableTickets > 10 ? 10 : event.availableTickets} 
                  placeholder="Jumlah tiket" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel className="flex items-center"><Percent className="mr-2 h-4 w-4 text-primary" />Kode Kupon (Opsional)</FormLabel>
          <div className="flex items-center gap-2">
            <FormControl>
              <Input 
                placeholder="Masukkan kode kupon" 
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                disabled={!!appliedCoupon}
              />
            </FormControl>
            <Button 
              type="button" 
              onClick={handleApplyCoupon} 
              variant="outline"
              disabled={!!appliedCoupon || !couponInput.trim()}
            >
              Terapkan
            </Button>
          </div>
           {appliedCoupon && (
            <FormDescription className="text-green-600 flex items-center mt-1">
              <CheckCircle className="mr-1 h-4 w-4"/> Kupon "{appliedCoupon.code}" diterapkan!
            </FormDescription>
          )}
        </FormItem>

        <div className="space-y-1 text-sm">
            <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>Rp {subtotalPrice.toLocaleString()}</span>
            </div>
            {appliedCoupon && discountAmount > 0 && (
                <div className="flex justify-between text-destructive">
                    <span>Diskon ({appliedCoupon.code}):</span>
                    <span>- Rp {discountAmount.toLocaleString()}</span>
                </div>
            )}
        </div>

        <div className="text-lg font-semibold">
          Total Harga: Rp {finalTotalPrice.toLocaleString()}
        </div>
        <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={!selectedTier || isPending || isPaymentProcessing}>
          {isPaymentProcessing || isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CreditCard className="mr-2 h-4 w-4" />
          )}
          {isPaymentProcessing ? "Memproses..." : isPending ? "Memuat..." : "Lanjut ke Pembayaran"}
        </Button>
      </form>
    </Form>
  );
}
