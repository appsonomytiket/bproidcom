
import { MOCK_AFFILIATE_DATA } from "@/lib/constants";
import type { Affiliate } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, Users, Gift, ClipboardCopy, UserCircle, LogOut } from "lucide-react";
import { Separator } from "@/components/ui/separator";

// Simulate fetching affiliate data
async function getAffiliateData(): Promise<Affiliate> {
  return MOCK_AFFILIATE_DATA;
}

export default async function AffiliateDashboardPage() {
  const affiliate = await getAffiliateData();

  return (
    <div className="container py-12">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <h1 className="text-3xl font-bold text-primary">Affiliate Dashboard</h1>
        <div className="flex items-center gap-2">
          <UserCircle className="h-6 w-6 text-muted-foreground" />
          <span className="font-medium">{affiliate.name}</span>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
            <LogOut className="mr-1 h-4 w-4" /> Logout
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Summary & Profile */}
        <div className="lg:col-span-1 space-y-6">
            <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center text-xl"><DollarSign className="mr-2 h-6 w-6 text-accent" />Earnings Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <div className="flex justify-between">
                <span className="text-muted-foreground">Total Earnings:</span>
                <span className="font-semibold">Rp {affiliate.totalEarnings.toLocaleString()}</span>
                </div>
                <p className="text-xs text-muted-foreground pt-2">Your referral code: 
                    <span className="ml-1 font-mono text-accent bg-accent/10 px-2 py-1 rounded-md">{affiliate.referralCode}</span> 
                    <Button variant="ghost" size="icon" className="ml-1 h-6 w-6" onClick={() => typeof navigator !== 'undefined' && navigator.clipboard?.writeText(affiliate.referralCode)}>
                        <ClipboardCopy className="h-3 w-3" />
                    </Button>
                </p>
            </CardContent>
            <CardFooter>
                <Button className="w-full bg-primary hover:bg-primary/90">
                    <DollarSign className="mr-2 h-4 w-4" /> Withdraw Earnings
                </Button>
            </CardFooter>
            </Card>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-xl flex items-center"><UserCircle className="mr-2 h-6 w-6 text-accent" />My Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <p><strong>Name:</strong> {affiliate.name}</p>
                    <p><strong>Email:</strong> {affiliate.email}</p>
                </CardContent>
                 <CardFooter>
                    <Button variant="outline" className="w-full">Edit Profile</Button>
                </CardFooter>
            </Card>
        </div>

        {/* Right Column: Referred Sales & Withdrawal History */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-xl"><Users className="mr-2 h-6 w-6 text-accent" />Referred Sales</CardTitle>
              <CardDescription>Sales made through your referral code.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {affiliate.referredSales.length > 0 ? affiliate.referredSales.map((sale) => (
                    <TableRow key={sale.bookingId}>
                      <TableCell>{sale.eventName}</TableCell>
                      <TableCell>{new Date(sale.date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">Rp {sale.commission.toLocaleString()}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center">No referred sales yet.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-xl"><Gift className="mr-2 h-6 w-6 text-accent" />Withdrawal History</CardTitle>
              <CardDescription>Your past and pending withdrawals.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {affiliate.withdrawalHistory.length > 0 ? affiliate.withdrawalHistory.map((withdrawal, index) => (
                    <TableRow key={index}>
                      <TableCell>{new Date(withdrawal.date).toLocaleDateString()}</TableCell>
                      <TableCell>{withdrawal.status}</TableCell>
                      <TableCell className="text-right">Rp {withdrawal.amount.toLocaleString()}</TableCell>
                    </TableRow>
                  )) : (
                     <TableRow>
                      <TableCell colSpan={3} className="text-center">No withdrawal history.</TableCell>
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
