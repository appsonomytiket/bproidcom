
import { MOCK_AFFILIATE_DATA } from "@/lib/constants";
import type { Affiliate } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, Users, Gift, UserCircle, LogOut, Link as LinkIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { CopyButton } from "@/components/dashboard/CopyButton"; 

// Simulate fetching affiliate data
async function getAffiliateData(): Promise<Affiliate> {
  return MOCK_AFFILIATE_DATA;
}

export default async function AffiliateDashboardPage() {
  const affiliate = await getAffiliateData();
  const relativeAffiliateLink = `/?ref=${affiliate.referralCode}`;

  return (
    <div className="container py-12">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <h1 className="text-3xl font-bold text-primary">Dasbor Afiliasi</h1>
        <div className="flex items-center gap-2">
          <UserCircle className="h-6 w-6 text-muted-foreground" />
          <span className="font-medium">{affiliate.name}</span>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
            <LogOut className="mr-1 h-4 w-4" /> Keluar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Summary & Profile */}
        <div className="lg:col-span-1 space-y-6">
            <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center text-xl"><DollarSign className="mr-2 h-6 w-6 text-accent" />Ringkasan Penghasilan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-between">
                <span className="text-muted-foreground">Total Penghasilan:</span>
                <span className="font-semibold">Rp {affiliate.totalEarnings.toLocaleString()}</span>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Kode Referral Anda:</p>
                  <div className="flex items-center">
                    <span className="font-mono text-lg text-accent bg-accent/10 px-3 py-1.5 rounded-md">{affiliate.referralCode}</span>
                    <CopyButton textToCopy={affiliate.referralCode} label="Kode Referral" />
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Link Afiliasi (untuk dibagikan):</p>
                  <div className="bg-secondary/30 dark:bg-secondary/20 p-3 rounded-md shadow-sm">
                    <div className="flex items-center mb-2">
                        <LinkIcon className="h-4 w-4 mr-2 text-primary"/>
                        <span className="font-mono text-sm text-foreground break-all block">
                            {`[Alamat Website Anda]${relativeAffiliateLink}`}
                        </span>
                    </div>
                    <CopyButton textToCopy={relativeAffiliateLink} label="Link Afiliasi" useOrigin={true} />
                    <p className="text-xs text-muted-foreground mt-2">Klik tombol salin di atas. `[Alamat Website Anda]` akan otomatis diganti dengan domain website saat ini ketika disalin.</p>
                  </div>
                </div>
            </CardContent>
            <CardFooter>
                <Button className="w-full bg-primary hover:bg-primary/90">
                    <DollarSign className="mr-2 h-4 w-4" /> Tarik Penghasilan
                </Button>
            </CardFooter>
            </Card>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-xl flex items-center"><UserCircle className="mr-2 h-6 w-6 text-accent" />Profil Saya</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <p><strong>Nama:</strong> {affiliate.name}</p>
                    <p><strong>Email:</strong> {affiliate.email}</p>
                </CardContent>
                 <CardFooter>
                    <Button variant="outline" className="w-full">Ubah Profil</Button>
                </CardFooter>
            </Card>
        </div>

        {/* Right Column: Referred Sales & Withdrawal History */}
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
                      <TableCell>{withdrawal.status === 'Completed' ? 'Selesai' : withdrawal.status === 'Processing' ? 'Diproses' : withdrawal.status}</TableCell>
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

