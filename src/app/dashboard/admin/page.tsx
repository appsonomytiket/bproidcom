
import { AdminSalesChart } from "@/components/dashboard/AdminSalesChart";
import { AdminRecentBookingsTable } from "@/components/dashboard/AdminRecentBookingsTable";
import { MOCK_ADMIN_SALES_DATA, MOCK_RECENT_BOOKINGS_ADMIN, MOCK_ADMIN_COMMISSION_DATA, MOCK_TOP_AFFILIATES_ADMIN } from "@/lib/constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, Users, BarChartBig } from "lucide-react";
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { ChartTooltipContent } from "@/components/ui/chart"


export default async function AdminDashboardPage() {
  const salesData = MOCK_ADMIN_SALES_DATA;
  const commissionData = MOCK_ADMIN_COMMISSION_DATA;
  const recentBookings = MOCK_RECENT_BOOKINGS_ADMIN;
  const topAffiliates = MOCK_TOP_AFFILIATES_ADMIN;

  return (
    <div className="container py-12">
      <h1 className="mb-8 text-3xl font-bold text-primary">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {salesData.reduce((acc, curr) => acc + curr.sales * 1000, 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commissions Paid</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {commissionData.reduce((acc, curr) => acc + curr.commissions * 1000, 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+15.2% from last month</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Events</CardTitle>
            <BarChartBig className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+2 since last week</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AdminSalesChart data={salesData} />
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Commission Payouts</CardTitle>
            <CardDescription>Monthly commission payouts (in thousands IDR)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={commissionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `Rp${value}K`} />
                  <Tooltip content={<ChartTooltipContent indicator="dot" />} cursor={{ stroke: "hsl(var(--accent))", strokeWidth: 2, strokeDasharray: "3 3" }} />
                  <Line type="monotone" dataKey="commissions" stroke="hsl(var(--accent))" strokeWidth={2} activeDot={{ r: 8, style: { fill: "hsl(var(--accent))" } }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AdminRecentBookingsTable bookings={recentBookings} />
        </div>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Top Affiliates</CardTitle>
            <CardDescription>Affiliates with highest earnings.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Referral Code</TableHead>
                  <TableHead className="text-right">Earnings</TableHead>
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
