
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
import { useRouter, useSearchParams } from "next/navigation"; // Ditambahkan useSearchParams
import type { Event, EventPriceTier, Coupon } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Ticket, User, Mail, Tag, Percent, CheckCircle, Loader2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { MOCK_COUPONS, LOCAL_STORAGE_COUPONS_KEY } from "@/lib/constants";
import { parseISO } from "date-fns";
import { supabase } from "@/lib/supabaseClient"; // Import Supabase client

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
  const searchParamsHook = useSearchParams(); // Untuk mengambil kode referral dari URL
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
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
    setCouponInput(""); // Reset input kupon juga
    form.setValue("couponCode", ""); // Reset nilai kupon di form
  }, [currentSelectedTierName, currentTickets, event.priceTiers, form]);

  const subtotalPrice = selectedTier ? currentTickets * selectedTier.price : 0;
  const finalTotalPrice = subtotalPrice - discountAmount;

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) {
      toast({ title: "Kode Kupon Kosong", description: "Silakan masukkan kode kupon.", variant: "destructive" });
      return;
    }
    if (!selectedTier) {
      toast({ title: "Tier Belum Dipilih", description: "Silakan pilih jenis tiket terlebih dahulu.", variant: "destructive" });
      return;
    }

    // Mengambil kupon dari database Supabase
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
    } else { // fixed
      calculatedDiscount = couponToApply.discount_value;
    }
    calculatedDiscount = Math.min(calculatedDiscount, subtotalPrice); 

    setAppliedCoupon(couponToApply as unknown as Coupon); // Cast karena tipe dari DB mungkin sedikit berbeda
    setDiscountAmount(calculatedDiscount);
    form.setValue("couponCode", couponToApply.code);
    toast({ title: "Kupon Diterapkan!", description: `Anda mendapat diskon Rp ${calculatedDiscount.toLocaleString()}.` });
  };


  async function onSubmit(values: BookingFormValues) {
    if (!selectedTier) {
      toast({ title: "Kesalahan Pemesanan", description: "Tier tiket tidak valid.", variant: "destructive" });
      return;
    }
    
    startTransition(async () => {
      let userId;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
      }

      const usedReferralCode = searchParamsHook.get('ref') || undefined;

      const bookingPayload = {
        event_id: event.id,
        user_id: userId,
        num_tickets: values.tickets,
        selected_tier_name: selectedTier.name,
        coupon_code: appliedCoupon ? appliedCoupon.code : undefined,
        user_name: values.name,
        user_email: values.email,
        used_referral_code: usedReferralCode,
      };

      try {
        const { data: functionResponse, error: functionError } = await supabase.functions.invoke(
          'create-booking',
          { body: bookingPayload }
        );

        if (functionError) {
          console.error("Edge function error:", functionError);
          throw new Error(functionError.message || 'Gagal memanggil fungsi pemesanan.');
        }
        
        if (functionResponse.error) {
            console.error("Error from edge function logic:", functionResponse.error, functionResponse.details);
            throw new Error(functionResponse.error || 'Terjadi kesalahan pada server saat memproses pemesanan.');
        }


        toast({
          title: "Pemesanan Terkirim!",
          description: `Pemesanan Anda untuk ${event.name} (${selectedTier.name}) sedang diproses.`,
        });

        if (typeof window !== 'undefined') {
          // Simpan detail yang dibutuhkan halaman konfirmasi
          localStorage.setItem('bookingDetails', JSON.stringify({
            bookingId: functionResponse.bookingId, // Dari respons fungsi
            eventName: functionResponse.eventName,
            name: values.name,
            email: values.email,
            tickets: values.tickets, // atau functionResponse.numTickets
            totalPrice: functionResponse.totalPrice,
            buyerReferralCode: functionResponse.buyerReferralCode,
            selectedTierName: functionResponse.selectedTierName,
            selectedTierPrice: selectedTier.price, // Ambil dari state atau event prop
            couponCode: functionResponse.couponCode,
            discountAmount: functionResponse.discountAmount,
          }));
        }
        
        router.push(`/booking/confirmation/${functionResponse.bookingId}`);

      } catch (error: any) {
        toast({
          title: "Gagal Memproses Pemesanan",
          description: error.message || "Terjadi masalah saat menghubungi server.",
          variant: "destructive",
        });
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
        <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={!selectedTier || isPending}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Pesan Sekarang"}
        </Button>
      </form>
    </Form>
  );
}
