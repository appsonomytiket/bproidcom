
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Share2 } from "lucide-react";

export default function AffiliatesManagementPage() {
  return (
    <div className="container py-12">
      <Card className="mx-auto max-w-3xl shadow-xl">
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
        <CardContent className="p-6 md:p-8">
          <p>Halaman ini akan digunakan untuk mengelola semua aspek program afiliasi, termasuk pendaftaran afiliasi, pelacakan referral, perhitungan komisi, dan pembayaran.</p>
          {/* Konten manajemen afiliasi akan ditambahkan di sini */}
        </CardContent>
      </Card>
    </div>
  );
}
