
// src/app/dashboard/admin/affiliates-management/page.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MOCK_TOP_AFFILIATES_ADMIN, MOCK_ADMIN_WITHDRAWAL_REQUESTS } from "@/lib/constants";
import type { AdminWithdrawalRequest, Affiliate } from "@/lib/types";
import { Share2, Users, DollarSign, CheckCircle, XCircle, AlertCircle, Hourglass, MoreHorizontal } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

// Simulate fetching data
async function getAffiliateManagementData(): Promise<{ affiliates: Pick<Affiliate, 'id' | 'name' | 'referralCode' | 'totalEarnings' | 'email'>[], withdrawals: AdminWithdrawalRequest[] }> {
  return {
    affiliates: MOCK_TOP_AFFILIATES_ADMIN,
    withdrawals: MOCK_ADMIN_WITHDRAWAL_REQUESTS,
  };
}

export default function AffiliatesManagementPage() {
  // In a real app, you would fetch data in a useEffect or use a server component approach
  const [affiliates, setAffiliates] = React.useState<Pick<Affiliate, 'id' | 'name' | 'referralCode' | 'totalEarnings' | 'email'>[]>([]);
  const [withdrawals, setWithdrawals] = React.useState<AdminWithdrawalRequest[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getAffiliateManagementData().then(data => {
      setAffiliates(data.affiliates);
      setWithdrawals(data.withdrawals);
      setLoading(false);
    });
  }, []);

  const getWithdrawalStatusText = (status: AdminWithdrawalRequest['status']) => {
    switch (status) {
      case 'Pending': return 'Tertunda';
      case 'Approved': return 'Disetujui';
      case 'Rejected': return 'Ditolak';
      case 'Completed': return 'Selesai';
      default: return status;
    }
  };

  const getWithdrawalStatusVariant = (status: AdminWithdrawalRequest['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'Pending': return 'secondary';
      case 'Approved': return 'default'; // Assuming default is green-ish or primary
      case 'Rejected': return 'destructive';
      case 'Completed': return 'outline'; // Or another variant like success if available
      default: return 'outline';
    }
  };

   const getWithdrawalStatusIcon = (status: AdminWithdrawalRequest['status']) => {
    switch (status) {
      case 'Pending': return <Hourglass className="mr-2 h-4 w-4" />;
      case 'Approved': return <CheckCircle className="mr-2 h-4 w-4 text-green-500" />;
      case 'Rejected': return <XCircle className="mr-2 h-4 w-4 text-red-500" />;
      case 'Completed': return <CheckCircle className="mr-2 h-4 w-4 text-blue-500" />; // Or a different check color
      default: return <AlertCircle className="mr-2 h-4 w-4" />;
    }
  };


  if (loading) {
    return (
      <div className="container py-12">
        <p>Memuat data manajemen afiliasi...</p>
      </div>
    );
  }

  return (
    <div className="container py-12 space-y-8">
      <Card className="shadow-xl">
        <CardHeader className="bg-primary text-primary-foreground p-6 rounded-t-lg">
          <div className="flex items-center gap-3">
            <Share2 className="h-10 w-10" />
            <div>
              <CardTitle className="text-3xl font-bold">Manajemen Afiliasi</CardTitle>
              <CardDescription className="text-primary-foreground/80">
                Kelola akun afiliasi, komisi, dan performa mereka.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0"> {/* Remove padding to make table flush */}
          {/* Placeholder for overall stats or actions */}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center text-xl"><Users className="mr-2 h-6 w-6 text-accent" />Daftar Afiliasi</CardTitle>
              <CardDescription>Afiliasi yang terdaftar di platform.</CardDescription>
            </div>
            <Button variant="outline" size="sm"><Users className="mr-2 h-4 w-4" /> Tambah Afiliasi Baru</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Kode Referral</TableHead>
                <TableHead className="text-right">Total Penghasilan</TableHead>
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {affiliates.length > 0 ? affiliates.map((affiliate) => (
                <TableRow key={affiliate.id}>
                  <TableCell className="font-medium">{affiliate.name}</TableCell>
                  <TableCell>{affiliate.email}</TableCell>
                  <TableCell>{affiliate.referralCode}</TableCell>
                  <TableCell className="text-right">Rp {affiliate.totalEarnings.toLocaleString()}</TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="icon" onClick={() => alert(`Kelola ${affiliate.name}`)}>
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Kelola Afiliasi</span>
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">Belum ada afiliasi terdaftar.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center text-xl"><DollarSign className="mr-2 h-6 w-6 text-accent" />Permintaan Penarikan</CardTitle>
              <CardDescription>Permintaan penarikan komisi dari afiliasi.</CardDescription>
            </div>
            {/* Maybe a filter here later */}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Penarikan</TableHead>
                <TableHead>Nama Afiliasi</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {withdrawals.length > 0 ? withdrawals.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="font-medium">{req.id}</TableCell>
                  <TableCell>{req.affiliateName}</TableCell>
                  <TableCell>{format(new Date(req.date), "PPpp", { locale: idLocale })}</TableCell>
                  <TableCell className="text-right">Rp {req.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={getWithdrawalStatusVariant(req.status)} className="flex items-center w-fit">
                      {getWithdrawalStatusIcon(req.status)}
                      {getWithdrawalStatusText(req.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="icon" onClick={() => alert(`Proses permintaan ${req.id}`)}>
                      <MoreHorizontal className="h-4 w-4" />
                       <span className="sr-only">Proses Permintaan</span>
                    </Button>
                    {/* Add Approve/Reject buttons if status is Pending */}
                    {/* Example:
                    {req.status === 'Pending' && (
                      <div className="flex gap-1 justify-center">
                        <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700">Setujui</Button>
                        <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700">Tolak</Button>
                      </div>
                    )}
                    */}
                  </TableCell>
                </TableRow>
              )) : (
                 <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">Tidak ada permintaan penarikan.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
