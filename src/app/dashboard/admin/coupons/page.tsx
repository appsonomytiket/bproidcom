
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
// import { MOCK_COUPONS, LOCAL_STORAGE_COUPONS_KEY } from "@/lib/constants"; // No longer using localStorage
import type { Coupon } from "@/lib/types";
import { createBrowserClient } from '@supabase/ssr'; // Import Supabase client
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Switch } from "@/components/ui/switch";
import { PlusCircle, Trash2, BadgePercent, RotateCcw, Edit } from "lucide-react";
import { format, parseISO, formatISO } from "date-fns"; // Added formatISO
import { id as idLocale } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface FormattedCoupon extends Coupon {
  formattedExpiryDate: string;
  isExpired: boolean;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<FormattedCoupon[]>([]);
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('expires_at', { ascending: false, nullsFirst: false }); // Show non-expiring first or last based on preference

      if (error) throw error;

      const mappedAndFormatted = data?.map((dbCoupon: any) => { // dbCoupon is snake_case from Supabase
        const appCoupon: Coupon = { // Map to camelCase Coupon type from lib/types.ts
          id: dbCoupon.id,
          code: dbCoupon.code,
          description: dbCoupon.description,
          discountType: dbCoupon.discount_type, // Assuming 'fixed_amount' in DB matches 'fixed' in type or type needs update
          discountValue: dbCoupon.discount_value,
          expiryDate: dbCoupon.expires_at, // Keep as ISO string
          isActive: dbCoupon.is_active,
          usageLimit: dbCoupon.max_uses,
          timesUsed: dbCoupon.times_used,
          minPurchase: dbCoupon.min_purchase_amount,
        };
        const expiry = appCoupon.expiryDate ? parseISO(appCoupon.expiryDate) : null;
        return {
          ...appCoupon, // Spread the mapped camelCase coupon
          formattedExpiryDate: expiry ? format(expiry, "PP", { locale: idLocale }) : "Tidak ada batas",
          isExpired: expiry ? new Date() > expiry : false,
        };
      }) || [];
      setCoupons(mappedAndFormatted);
    } catch (error: any) {
      console.error("Gagal memuat kupon dari Supabase:", error);
      toast({
        title: "Gagal Memuat Kupon",
        description: error.message || "Terjadi masalah saat mengambil data kupon.",
        variant: "destructive",
      });
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleActive = async (couponToToggle: FormattedCoupon) => {
    try {
      const newIsActiveStatus = !couponToToggle.isActive; // Use isActive from FormattedCoupon
      // Call update-coupon function to toggle status
      // We need to send all required fields for the update-coupon function,
      // or modify update-coupon to handle partial updates for 'is_active'
      // For now, let's assume update-coupon can handle just the active status change if other fields are optional
      // Or, more robustly, fetch the full coupon and send all its data with the changed is_active.
      // The `update-coupon` function expects more fields.
      // A simpler approach for just toggling active status might be a direct DB update if RLS allows.
      // Or create a dedicated `toggle-coupon-status` function.
      // For now, using the existing `update-coupon` function:
      // Map camelCase FormattedCoupon back to snake_case for the Edge Function
      const payloadForUpdate = {
        coupon_id: couponToToggle.id,
        code: couponToToggle.code,
        discount_type: couponToToggle.discountType, // Map back
        discount_value: couponToToggle.discountValue, // Map back
        expires_at: couponToToggle.expiryDate ? formatISO(parseISO(couponToToggle.expiryDate)) : null, // Map back
        is_active: newIsActiveStatus,
        max_uses: couponToToggle.usageLimit, // Map back
        min_purchase_amount: couponToToggle.minPurchase, // Map back
        description: couponToToggle.description,
        // applicable_event_ids: couponToToggle.applicable_event_ids, // if used
      };
      
      const { error } = await supabase.functions.invoke('update-coupon', {
        body: payloadForUpdate,
      });

      if (error) throw error;

      loadCoupons(); // Reload coupons
      toast({
        title: `Status Kupon Diubah`,
        description: `Kupon ${couponToToggle.code} sekarang ${newIsActiveStatus ? 'aktif' : 'tidak aktif'}.`,
      });
    } catch (error: any) {
       console.error("Gagal mengubah status kupon:", error);
        toast({
          title: "Gagal Mengubah Status",
          description: error.message || "Terjadi masalah.",
          variant: "destructive",
        });
    }
  };
  
  const handleDeleteCoupon = async (id: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus kupon ${id}? Ini akan menghapusnya dari database.`)) {
      try {
        const { error } = await supabase
          .from('coupons')
          .delete()
          .match({ id: id });

        if (error) throw error;

        loadCoupons(); // Reload coupons
        toast({
          title: "Kupon Dihapus",
          description: `Kupon ${id} telah dihapus dari database.`,
        });
      } catch (error: any) {
        console.error("Gagal menghapus kupon dari Supabase:", error);
        toast({
          title: "Gagal Menghapus Kupon",
          description: error.message || "Terjadi masalah.",
          variant: "destructive",
        });
      }
    }
  };

  // const handleResetCoupons = () => { // This is no longer relevant with Supabase
  // };
  
  // Placeholder for Edit Coupon functionality is removed as Link will be used directly
  // const handleEditCoupon = (id: string) => {
  //   // router.push(`/dashboard/admin/coupons/edit/${id}`); 
  // };


  return (
    <div className="container py-12 space-y-8">
      <Card className="shadow-xl">
        <CardHeader className="bg-primary text-primary-foreground p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BadgePercent className="h-10 w-10" />
              <div>
                <CardTitle className="text-3xl font-bold">Kelola Kupon</CardTitle>
                <CardDescription className="text-primary-foreground/80">
                  Buat, lihat, dan kelola kupon diskon untuk platform Anda dari database.
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              {/* Reset button removed as it's for localStorage */}
              <Button asChild variant="default" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Link href="/dashboard/admin/coupons/new">
                  <PlusCircle className="mr-2 h-4 w-4" /> Tambah Kupon Baru
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {coupons.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p>Tidak ada kupon yang ditemukan. Coba tambahkan kupon baru atau reset ke kupon default.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode Kupon</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Diskon</TableHead>
                  <TableHead>Min. Pembelian</TableHead>
                  <TableHead>Berlaku Hingga</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Digunakan</TableHead>
                  <TableHead className="text-center">Aktif</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => (
                  <TableRow key={coupon.id} className={coupon.isExpired && !coupon.isActive ? "opacity-50" : ""}>
                    <TableCell className="font-medium">{coupon.code}</TableCell>
                    <TableCell className="text-xs max-w-xs truncate">{coupon.description || "-"}</TableCell>
                    <TableCell>
                      {coupon.discountType === 'percentage' 
                        ? `${coupon.discountValue}%` 
                        : `Rp ${coupon.discountValue.toLocaleString()}`}
                    </TableCell>
                    <TableCell>Rp {coupon.minPurchase?.toLocaleString() || '0'}</TableCell>
                    <TableCell>{coupon.formattedExpiryDate}</TableCell>
                    <TableCell>
                      <Badge variant={coupon.isActive && !coupon.isExpired ? "default" : "destructive"}>
                        {coupon.isActive && !coupon.isExpired ? 'Aktif' : (coupon.isExpired ? 'Kadaluwarsa' : 'Nonaktif')}
                      </Badge>
                    </TableCell>
                    <TableCell>{coupon.timesUsed} / {coupon.usageLimit || '∞'}</TableCell> 
                    <TableCell className="text-center">
                      <Switch
                        checked={coupon.isActive && !coupon.isExpired}
                        onCheckedChange={() => handleToggleActive(coupon)}
                        disabled={coupon.isExpired} // Still disable if expired, as activating an expired coupon is odd
                        aria-label="Aktifkan kupon"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center space-x-1">
                         <Button variant="outline" size="icon" asChild title="Edit Kupon">
                           <Link href={`/dashboard/admin/coupons/${coupon.id}/edit`}>
                             <Edit className="h-4 w-4" />
                             <span className="sr-only">Edit</span>
                           </Link>
                        </Button>
                        <Button variant="destructive" size="icon" onClick={() => handleDeleteCoupon(coupon.id)} title="Hapus Kupon">
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Hapus</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
