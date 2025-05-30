
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MOCK_COUPONS, LOCAL_STORAGE_COUPONS_KEY } from "@/lib/constants";
import type { Coupon } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Switch } from "@/components/ui/switch";
import { PlusCircle, Trash2, BadgePercent, RotateCcw, Edit } from "lucide-react";
import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface FormattedCoupon extends Coupon {
  formattedExpiryDate: string;
  isExpired: boolean;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<FormattedCoupon[]>([]);
  const { toast } = useToast();

  const loadCoupons = () => {
    let currentCoupons: Coupon[];
    try {
      const storedCouponsString = localStorage.getItem(LOCAL_STORAGE_COUPONS_KEY);
      if (storedCouponsString) {
        currentCoupons = JSON.parse(storedCouponsString);
      } else {
        currentCoupons = MOCK_COUPONS;
        localStorage.setItem(LOCAL_STORAGE_COUPONS_KEY, JSON.stringify(MOCK_COUPONS));
      }
    } catch (error) {
      console.error("Gagal memuat atau mem-parse kupon dari localStorage:", error);
      toast({
        title: "Gagal Memuat Kupon",
        description: "Menggunakan data kupon default.",
        variant: "destructive",
      });
      currentCoupons = MOCK_COUPONS;
    }
    
    const formatted = currentCoupons.map(coupon => {
      const expiry = parseISO(coupon.expiryDate);
      return {
        ...coupon,
        formattedExpiryDate: format(expiry, "PP", { locale: idLocale }),
        isExpired: new Date() > expiry,
      };
    }).sort((a, b) => parseISO(b.expiryDate).getTime() - parseISO(a.expiryDate).getTime()); // Sort by expiry date descending
    setCoupons(formatted);
  };

  useEffect(() => {
    loadCoupons();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleActive = (id: string, currentIsActive: boolean) => {
    try {
      const updatedCoupons = coupons.map(coupon => 
        coupon.id === id ? { ...coupon, isActive: !currentIsActive } : coupon
      );
      // Extract non-formatted coupon for storage
      const storableCoupons = updatedCoupons.map(({ formattedExpiryDate, isExpired, ...rest }) => rest);
      localStorage.setItem(LOCAL_STORAGE_COUPONS_KEY, JSON.stringify(storableCoupons));
      loadCoupons(); // Reload and reformat
      toast({
        title: `Status Kupon Diubah`,
        description: `Kupon ${id} sekarang ${!currentIsActive ? 'aktif' : 'tidak aktif'}.`,
      });
    } catch (error) {
       console.error("Gagal mengubah status kupon:", error);
        toast({
          title: "Gagal Mengubah Status",
          variant: "destructive",
        });
    }
  };
  
  const handleDeleteCoupon = (id: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus kupon ${id}?`)) {
      try {
        const storedCouponsString = localStorage.getItem(LOCAL_STORAGE_COUPONS_KEY);
        if (storedCouponsString) {
          let allCoupons: Coupon[] = JSON.parse(storedCouponsString);
          const updatedCoupons = allCoupons.filter(coupon => coupon.id !== id);
          localStorage.setItem(LOCAL_STORAGE_COUPONS_KEY, JSON.stringify(updatedCoupons));
          loadCoupons();
          toast({
            title: "Kupon Dihapus",
            description: `Kupon ${id} telah dihapus.`,
          });
        }
      } catch (error) {
        console.error("Gagal menghapus kupon:", error);
        toast({
          title: "Gagal Menghapus Kupon",
          variant: "destructive",
        });
      }
    }
  };

  const handleResetCoupons = () => {
    if (confirm("Apakah Anda yakin ingin mereset semua kupon ke daftar awal? Semua kupon yang ditambahkan atau diubah akan hilang.")) {
      localStorage.setItem(LOCAL_STORAGE_COUPONS_KEY, JSON.stringify(MOCK_COUPONS));
      loadCoupons();
      toast({
        title: "Kupon Direset",
        description: "Daftar kupon telah dikembalikan ke kondisi awal.",
      });
    }
  };
  
  // Placeholder for Edit Coupon functionality
  const handleEditCoupon = (id: string) => {
    toast({
      title: "Fitur Dalam Pengembangan",
      description: `Edit untuk kupon ${id} belum tersedia.`,
    });
    // router.push(`/dashboard/admin/coupons/edit/${id}`); // Potential future route
  };


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
                  Buat, lihat, dan kelola kupon diskon untuk platform Anda.
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleResetCoupons} variant="outline" className="bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30">
                <RotateCcw className="mr-2 h-4 w-4" /> Reset Kupon
              </Button>
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
                        onCheckedChange={() => handleToggleActive(coupon.id, coupon.isActive)}
                        disabled={coupon.isExpired}
                        aria-label="Aktifkan kupon"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center space-x-1">
                         <Button variant="outline" size="icon" onClick={() => handleEditCoupon(coupon.id)} title="Edit Kupon (Belum Tersedia)">
                          <Edit className="h-4 w-4" />
                           <span className="sr-only">Edit</span>
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
