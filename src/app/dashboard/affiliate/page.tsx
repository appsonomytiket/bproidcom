
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { MOCK_AFFILIATE_DATA, MOCK_EVENTS } from "@/lib/constants";
import type { Affiliate, Event } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  DollarSign, Users, Gift, UserCircle, Link as LinkIcon, 
  TrendingUp, Wallet, ExternalLink, ShoppingCart, Search, ClipboardCopy 
} from "lucide-react"; // LogOut icon removed as the button is removed
import { Separator } from "@/components/ui/separator";
import { CopyButton } from "@/components/dashboard/CopyButton";
import { useToast } from "@/hooks/use-toast";

// Simulate fetching affiliate data - in a real app, this would be dynamic
async function getAffiliateDataClient(): Promise<Affiliate> {
  // For client component, we can directly use the mock or fetch if needed
  return MOCK_AFFILIATE_DATA;
}

// Simulate fetching events - in a real app, this would be dynamic
async function getEventsClient(): Promise<Event[]> {
  return MOCK_EVENTS;
}

export default function AffiliateDashboardPage() {
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [eventPathInput, setEventPathInput] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [generatedLink, setGeneratedLink] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    getAffiliateDataClient().then(data => setAffiliate(data));
    getEventsClient().then(data => setAllEvents(data));
  }, []);

  const filteredEvents = useMemo(() => {
    if (!searchTerm) return allEvents.slice(0, 5); // Show initial few events or all if fewer
    return allEvents.filter(event => 
      event.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 10); // Limit search results
  }, [searchTerm, allEvents]);

  const handleEventSelect = (event: Event) => {
    setEventPathInput(`/events/${event.id}`);
  };

  const handleGenerateLink = () => {
    if (!affiliate) {
      toast({ title: "Kesalahan", description: "Data afiliasi tidak ditemukan.", variant: "destructive" });
      return;
    }
    if (!eventPathInput.trim()) {
      toast({ title: "Input Kosong", description: "Silakan masukkan URL atau pilih acara.", variant: "destructive" });
      return;
    }
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    // Ensure eventPathInput starts with a slash if it's a path
    const path = eventPathInput.startsWith('/') ? eventPathInput : `/${eventPathInput}`;
    const finalLink = `${baseUrl}${path}?ref=${affiliate.referralCode}`;
    setGeneratedLink(finalLink);
    toast({ title: "Tautan Dibuat!", description: "Tautan afiliasi Anda telah berhasil dibuat." });
  };

  if (!affiliate) {
    return <div className="container py-12">Memuat data afiliasi...</div>;
  }

  const relativeAffiliateLink = `/?ref=${affiliate.referralCode}`; // General affiliate link

  // Placeholder values for new stats cards based on the image
  const stats = {
    totalCommission: 0,
    pendingBalance: 0,
    totalClicks: 0,
    totalConversions: 0,
  };

  return (
    <div className="container py-12 space-y-8">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Dasbor Afiliasi Anda</h1>
          <p className="text-muted-foreground">
            Selamat datang! Di sini Anda dapat membuat tautan afiliasi unik, melacak kinerja, dan mengelola penghasilan Anda dengan BPro Tiket.
          </p>
        </div>
        {/* Bagian nama pengguna dan tombol keluar dihapus dari sini */}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Komisi Diperoleh</CardTitle>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {stats.totalCommission.toLocaleString()}</div>
            {/* <p className="text-xs text-muted-foreground">+X% dari bulan lalu</p> */}
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Tersedia (Pending)</CardTitle>
            <Wallet className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {stats.pendingBalance.toLocaleString()}</div>
            <Button variant="outline" size="sm" className="mt-2 text-xs h-7" onClick={() => alert('Minta Penarikan belum difungsikan.')}>Minta Penarikan</Button>
            <p className="text-xs text-muted-foreground mt-1">
              Info bank belum lengkap. <Link href="/dashboard/user/settings" className="text-primary hover:underline">Lengkapi di sini</Link>.
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Klik Tautan</CardTitle>
            <ExternalLink className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClicks}</div>
            <p className="text-xs text-muted-foreground">(Segera Hadir: Pelacakan klik detail)</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Konversi (Penjualan)</CardTitle>
            <ShoppingCart className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalConversions}</div>
             {/* <p className="text-xs text-muted-foreground">+X penjualan bulan ini</p> */}
          </CardContent>
        </Card>
      </div>

      {/* Link Generator Card */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <LinkIcon className="mr-2 h-6 w-6 text-accent" />Buat Tautan Afiliasi Anda
          </CardTitle>
          <CardDescription>
            Gunakan kode afiliasi unik Anda: <strong className="text-accent">{affiliate.referralCode}</strong>. 
            Pilih acara di bawah ini atau masukkan URL acara untuk membuat tautan referal. 
            Bagikan tautan tersebut untuk mendapatkan komisi dari setiap penjualan tiket.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="eventPath" className="text-sm font-medium">URL atau Path Halaman Acara</Label>
            <Input 
              id="eventPath" 
              placeholder="/events/id-acara-unik" 
              value={eventPathInput}
              onChange={(e) => setEventPathInput(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">Ketik path acara (mis., /events/id-acara) atau pilih dari daftar di bawah.</p>
          </div>

          <div>
            <Label htmlFor="searchEvent" className="text-sm font-medium">Cari Acara untuk Ditautkan</Label>
            <div className="relative mt-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                id="searchEvent" 
                placeholder="Ketik nama acara..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9" 
              />
            </div>
          </div>

          {filteredEvents.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Pilih Acara (Opsional)</Label>
              <p className="text-xs text-muted-foreground mb-1">Klik acara untuk mengisi path-nya secara otomatis.</p>
              <ScrollArea className="h-40 w-full rounded-md border p-2 bg-secondary/20">
                {filteredEvents.map(event => (
                  <div 
                    key={event.id} 
                    onClick={() => handleEventSelect(event)}
                    className="p-2 hover:bg-accent/20 rounded-md cursor-pointer text-sm"
                  >
                    {event.name} <span className="text-xs text-muted-foreground ml-1">(/events/{event.id})</span>
                  </div>
                ))}
              </ScrollArea>
            </div>
          )}
          
          <Button onClick={handleGenerateLink} className="bg-primary hover:bg-primary/90">
            <LinkIcon className="mr-2 h-4 w-4" /> Buat Tautan
          </Button>

          {generatedLink && (
            <div className="space-y-1">
              <Label className="text-sm font-medium">Tautan Afiliasi Anda:</Label>
              <div className="flex items-center gap-2 rounded-md border bg-muted p-3">
                <p className="text-sm font-mono break-all flex-grow">{generatedLink}</p>
                <CopyButton textToCopy={generatedLink} label="Tautan Afiliasi" />
              </div>
              <p className="text-xs text-muted-foreground">Bagikan tautan ini. Ketika pengguna membeli tiket melaluinya, Anda akan mendapatkan komisi.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* General Affiliate Link - Kept from previous design if still relevant */}
      <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-xl"><LinkIcon className="mr-2 h-6 w-6 text-accent" />Link Afiliasi Umum Anda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
              <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Kode Referral Umum Anda:</p>
                  <div className="flex items-center">
                    <span className="font-mono text-lg text-accent bg-accent/10 px-3 py-1.5 rounded-md">{affiliate.referralCode}</span>
                    <CopyButton textToCopy={affiliate.referralCode} label="Kode Referral" />
                  </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Link Afiliasi Umum (untuk dibagikan ke beranda):</p>
                <div className="bg-secondary/30 dark:bg-secondary/20 p-3 rounded-md shadow-sm">
                  <div className="flex items-center mb-2">
                      <LinkIcon className="h-4 w-4 mr-2 text-primary"/>
                      <span className="font-mono text-sm text-foreground break-all block">
                          {`[Alamat Website Anda]${relativeAffiliateLink}`}
                      </span>
                  </div>
                  <CopyButton textToCopy={relativeAffiliateLink} label="Link Afiliasi Umum" useOrigin={true} />
                  <p className="text-xs text-muted-foreground mt-2">Klik tombol salin di atas. `[Alamat Website Anda]` akan otomatis diganti dengan domain website saat ini ketika disalin.</p>
                </div>
              </div>
          </CardContent>
      </Card>


      {/* Existing sections from previous design, placed below the new generator */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mt-8">
        <div className="lg:col-span-1 space-y-6">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-xl flex items-center"><UserCircle className="mr-2 h-6 w-6 text-accent" />Profil Saya</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <p><strong>Nama:</strong> {affiliate.name}</p>
                    <p><strong>Email:</strong> {affiliate.email}</p>
                </CardContent>
                 <CardFooter>
                    <Button variant="outline" className="w-full" asChild>
                        <Link href="/dashboard/user/settings">Ubah Profil & Info Bank</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-xl"><Users className="mr-2 h-6 w-6 text-accent" />Penjualan Referral</CardTitle>
              <CardDescription>Penjualan yang dilakukan melalui kode referral Anda.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Acara</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="text-right">Komisi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {affiliate.referredSales.length > 0 ? affiliate.referredSales.map((sale) => (
                    <TableRow key={sale.bookingId}>
                      <TableCell>{sale.eventName}</TableCell>
                      <TableCell>{new Date(sale.date).toLocaleDateString('id-ID')}</TableCell>
                      <TableCell className="text-right">Rp {sale.commission.toLocaleString()}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center">Belum ada penjualan referral.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-xl"><Gift className="mr-2 h-6 w-6 text-accent" />Riwayat Penarikan</CardTitle>
              <CardDescription>Penarikan Anda yang lalu dan yang tertunda.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {affiliate.withdrawalHistory.length > 0 ? affiliate.withdrawalHistory.map((withdrawal, index) => (
                    <TableRow key={index}>
                      <TableCell>{new Date(withdrawal.date).toLocaleDateString('id-ID')}</TableCell>
                      <TableCell>{withdrawal.status === 'Completed' ? 'Selesai' : withdrawal.status === 'Processing' ? 'Diproses' : withdrawal.status === 'Pending' ? 'Tertunda' : withdrawal.status}</TableCell>
                      <TableCell className="text-right">Rp {withdrawal.amount.toLocaleString()}</TableCell>
                    </TableRow>
                  )) : (
                     <TableRow>
                      <TableCell colSpan={3} className="text-center">Tidak ada riwayat penarikan.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

    