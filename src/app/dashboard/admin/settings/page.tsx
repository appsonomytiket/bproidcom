
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SlidersHorizontal } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="container py-12">
      <Card className="mx-auto max-w-3xl shadow-xl">
        <CardHeader className="bg-primary text-primary-foreground p-6 rounded-t-lg">
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="h-10 w-10" />
            <div>
              <CardTitle className="text-3xl font-bold">Pengaturan Admin</CardTitle>
              <CardDescription className="text-primary-foreground/80">
                Konfigurasi pengaturan umum untuk area admin dan platform.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <p>Halaman ini akan berisi berbagai opsi konfigurasi untuk platform Bproid.com, seperti pengaturan integrasi pembayaran, notifikasi email, dan parameter sistem lainnya.</p>
          {/* Konten pengaturan akan ditambahkan di sini */}
        </CardContent>
      </Card>
    </div>
  );
}
