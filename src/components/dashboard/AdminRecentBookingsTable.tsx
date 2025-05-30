
import type { Booking } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface AdminRecentBookingsTableProps {
  bookings: Booking[];
}

export function AdminRecentBookingsTable({ bookings }: AdminRecentBookingsTableProps) {
  const getPaymentStatusText = (status: 'pending' | 'paid' | 'failed') => {
    switch (status) {
      case 'paid':
        return 'Lunas';
      case 'pending':
        return 'Tertunda';
      case 'failed':
        return 'Gagal';
      default:
        return status;
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Pemesanan Terbaru</CardTitle>
        <CardDescription>Ringkasan pemesanan tiket terbaru.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Pemesanan</TableHead>
              <TableHead>Acara</TableHead>
              <TableHead>Pengguna</TableHead>
              <TableHead>Kode Referral</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell className="font-medium">{booking.id}</TableCell>
                <TableCell>{booking.eventName}</TableCell>
                <TableCell>{booking.userName}</TableCell>
                <TableCell>{booking.referralCode || "-"}</TableCell>
                <TableCell>{format(new Date(booking.bookingDate), "PP", { locale: idLocale })}</TableCell>
                <TableCell>
                  <Badge variant={booking.paymentStatus === 'paid' ? 'default' : booking.paymentStatus === 'pending' ? 'secondary' : 'destructive'}>
                    {getPaymentStatusText(booking.paymentStatus)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">Rp {booking.totalPrice.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
