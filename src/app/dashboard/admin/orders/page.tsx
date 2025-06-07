
import { AdminRecentBookingsTable } from "@/components/dashboard/AdminRecentBookingsTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient"; // Import Supabase client
import type { Booking } from "@/lib/types";
import { TicketCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

async function getOrderData(): Promise<Booking[] | null> {
  // Fetch data from Supabase
  // Ensure RLS allows admin to read all bookings
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id,
      event_id,
      event_name,
      user_id,
      user_name,
      user_email,
      tickets,
      total_price,
      booking_date,
      payment_status,
      coupon_code,
      discount_amount,
      selected_tier_name,
      ticket_pdf_url, 
      checked_in,
      checked_in_at,
      created_at,
      events ( name, location ) 
    `) // Added ticket_pdf_url, checked_in, checked_in_at and events relation
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching orders for admin:", error);
    return null; // Return null or throw error to be caught by error boundary
  }

  // Map to Booking type, assuming direct match or simple transformation if needed
  // The previous mapping in my-tickets was more complex due to snake_case to camelCase.
  // Here, we assume the Booking type in lib/types.ts matches the Supabase column names
  // or that the select query aliases them if necessary.
  // For now, let's assume direct mapping is mostly fine, but be mindful of case differences.
  const mappedOrders = data.map((order: any) => ({
    id: order.id,
    eventId: order.event_id,
    eventName: order.event_name || order.events?.name, // Use joined event name if booking.event_name is null
    userId: order.user_id,
    userName: order.user_name,
    userEmail: order.user_email,
    tickets: order.tickets,
    totalPrice: order.total_price,
    bookingDate: order.booking_date, // Ensure this is camelCase in type
    paymentStatus: order.payment_status,
    couponCode: order.coupon_code,
    discountAmount: order.discount_amount,
    selectedTierName: order.selected_tier_name,
    ticket_pdf_url: order.ticket_pdf_url,
    checked_in: order.checked_in,
    checked_in_at: order.checked_in_at,
    createdAt: order.created_at, // Ensure this is camelCase in type
    // events: order.events // This is already part of the select
  }));
  return mappedOrders as Booking[];
}

export default async function OrdersPage() {
  const orders = await getOrderData();

  if (!orders) {
    return (
      <div className="container flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center py-12 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Gagal Memuat Pesanan</h2>
        <p className="text-muted-foreground mb-6">Tidak dapat mengambil data pesanan saat ini. Silakan coba lagi nanti.</p>
        <Button asChild>
          <Link href="/dashboard/admin">Kembali ke Dasbor</Link>
        </Button>
      </div>
    );
  }
  
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
