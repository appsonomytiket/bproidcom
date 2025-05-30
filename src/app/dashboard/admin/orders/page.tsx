
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TicketCheck } from "lucide-react";

export default function OrdersPage() {
  return (
    <div className="container py-12">
      <Card className="mx-auto max-w-3xl shadow-xl">
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
          <p>Halaman ini akan digunakan untuk menampilkan dan mengelola semua pesanan yang masuk, termasuk detail pendaftar, status pembayaran, dan lainnya.</p>
          {/* Konten tabel pesanan akan ditambahkan di sini */}
        </CardContent>
      </Card>
    </div>
  );
}
