
"use client"; // Ditambahkan untuk memastikan ini adalah Client Component

import type { Booking } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Printer, Trash2 } from "lucide-react"; // Ditambahkan Printer, Trash2 mungkin diperlukan jika ada aksi hapus
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

interface AdminRecentBookingsTableProps {
  bookings: Booking[];
}

export function AdminRecentBookingsTable({ bookings }: AdminRecentBookingsTableProps) {
  const { toast } = useToast();

  const getPaymentStatusText = (status: Booking['paymentStatus']) => {
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

  const handlePrintTicket = (bookingId: string, pdfUrl?: string) => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    } else {
      toast({
        title: "Tiket PDF Belum Tersedia",
        description: `Pembuatan PDF untuk tiket ${bookingId} belum diimplementasikan.`,
        variant: "default",
      });
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
              <TableHead>Kupon</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-center">Tiket PDF</TableHead>
              <TableHead className="text-center">Checked In</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell className="font-medium">{booking.id.substring(0,8)}...</TableCell>
                <TableCell>{booking.eventName}</TableCell>
                <TableCell>{booking.userName}</TableCell>
                <TableCell>{booking.couponCode || "-"}</TableCell>
                <TableCell>{format(new Date(booking.bookingDate), "PPpp", { locale: idLocale })}</TableCell>
                <TableCell>
                  <Badge variant={booking.paymentStatus === 'paid' ? 'default' : booking.paymentStatus === 'pending' ? 'secondary' : 'destructive'}>
                    {getPaymentStatusText(booking.paymentStatus)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">Rp {booking.totalPrice.toLocaleString()}</TableCell>
                <TableCell className="text-center">
                  {booking.paymentStatus === 'paid' && booking.ticket_pdf_url ? (
                    <Button
                      variant="outline"
                      size="icon"
                      asChild
                      title="Unduh Tiket PDF"
                    >
                      <Link href={booking.ticket_pdf_url} target="_blank" rel="noopener noreferrer">
                        <Printer className="h-4 w-4" />
                        <span className="sr-only">Unduh Tiket</span>
                      </Link>
                    </Button>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {booking.paymentStatus === 'paid' ? (
                    booking.checked_in ? (
                      <Badge className="bg-green-500 hover:bg-green-600 text-white">
                        Ya ({booking.checked_in_at ? format(new Date(booking.checked_in_at), "dd/MM/yy HH:mm", { locale: idLocale }) : 'N/A'})
                      </Badge>
                    ) : (
                      <Badge variant="outline">Tidak</Badge>
                    )
                  ) : (
                    <Badge variant="secondary">-</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
