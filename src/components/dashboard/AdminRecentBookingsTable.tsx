
import type { Booking } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface AdminRecentBookingsTableProps {
  bookings: Booking[];
}

export function AdminRecentBookingsTable({ bookings }: AdminRecentBookingsTableProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Recent Bookings</CardTitle>
        <CardDescription>Overview of the latest ticket bookings.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Booking ID</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Date</TableHead>
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
                <TableCell>{format(new Date(booking.bookingDate), "PP")}</TableCell>
                <TableCell>
                  <Badge variant={booking.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                    {booking.paymentStatus}
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
