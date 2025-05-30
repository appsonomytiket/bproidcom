
import { AdminRecentBookingsTable } from "@/components/dashboard/AdminRecentBookingsTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MOCK_RECENT_BOOKINGS_ADMIN } from "@/lib/constants";
import type { Booking } from "@/lib/types";
import { TicketCheck } from "lucide-react";

// Simulate fetching data if this were a real backend
async function getOrderData(): Promise<Booking[]> {
  // In a real application, you would fetch this data from your database
  return MOCK_RECENT_BOOKINGS_ADMIN;
}

export default async function OrdersPage() {
  const orders = await getOrderData();

  return (
    <div className="container py-12">
      <Card className="mx-auto max-w-5xl shadow-xl"> {/* Adjusted max-width for better table display */}
        <CardHeader className="bg-primary text-primary-foreground p-6 rounded-t-lg">
          <div className="flex items-center gap-3">
            <TicketCheck className="h-10 w-10" />
            <div>
              <CardTitle className="text-3xl font-bold">Kelola Pesanan</CardTitle>
              <CardDescription className="text-primary-foreground/80">
                Lihat dan kelola semua pesanan tiket dan pendaftar acara.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          {orders.length > 0 ? (
            <AdminRecentBookingsTable bookings={orders} />
          ) : (
            <p className="text-center text-muted-foreground">Belum ada pesanan yang ditemukan.</p>
          )}
          {/* Future enhancements: Filters, search, pagination, actions per order */}
        </CardContent>
      </Card>
    </div>
  );
}
