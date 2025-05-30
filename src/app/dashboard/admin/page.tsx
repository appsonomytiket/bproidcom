
import { AdminSalesChart } from "@/components/dashboard/AdminSalesChart";
import { AdminRecentBookingsTable } from "@/components/dashboard/AdminRecentBookingsTable";
import { AdminCommissionChart } from "@/components/dashboard/AdminCommissionChart"; // Import the new component
import { MOCK_ADMIN_SALES_DATA, MOCK_RECENT_BOOKINGS_ADMIN, MOCK_ADMIN_COMMISSION_DATA, MOCK_TOP_AFFILIATES_ADMIN } from "@/lib/constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, Users, BarChartBig } from "lucide-react";

export default async function AdminDashboardPage() {
  const salesData = MOCK_ADMIN_SALES_DATA;
  const commissionData = MOCK_ADMIN_COMMISSION_DATA;
  const recentBookings = MOCK_RECENT_BOOKINGS_ADMIN;
  const topAffiliates = MOCK_TOP_AFFILIATES_ADMIN;

  return (
    <div className="container py-12">
      <h1 className="mb-8 text-3xl font-bold text-primary">Dasbor Admin</h1>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {salesData.reduce((acc, curr) => acc + curr.sales * 1000, 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+20.1% dari bulan lalu</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Komisi Dibayarkan</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {commissionData.reduce((acc, curr) => acc + curr.commissions * 1000, 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+15.2% dari bulan lalu</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acara Aktif</CardTitle>
            <BarChartBig className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+2 sejak minggu lalu</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AdminSalesChart data={salesData} />
        <AdminCommissionChart data={commissionData} /> {/* Use the new component here */}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AdminRecentBookingsTable bookings={recentBookings} />
        </div>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Afiliasi Teratas</CardTitle>
            <CardDescription>Afiliasi dengan penghasilan tertinggi.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kode Referral</TableHead>
                  <TableHead className="text-right">Penghasilan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topAffiliates.map((affiliate) => (
                  <TableRow key={affiliate.id}>
                    <TableCell>{affiliate.name}</TableCell>
                    <TableCell>{affiliate.referralCode}</TableCell>
                    <TableCell className="text-right">Rp {affiliate.totalEarnings.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
