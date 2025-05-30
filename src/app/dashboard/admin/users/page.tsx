
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UsersRound } from "lucide-react";

export default function UsersPage() {
  return (
    <div className="container py-12">
      <Card className="mx-auto max-w-3xl shadow-xl">
        <CardHeader className="bg-primary text-primary-foreground p-6 rounded-t-lg">
          <div className="flex items-center gap-3">
            <UsersRound className="h-10 w-10" />
            <div>
              <CardTitle className="text-3xl font-bold">Kelola Pengguna</CardTitle>
              <CardDescription className="text-primary-foreground/80">
                Lihat dan kelola akun pengguna yang terdaftar di platform.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <p>Halaman ini akan digunakan untuk melihat daftar pengguna, mengelola peran mereka (jika ada), dan mungkin tindakan administratif lainnya terkait akun pengguna.</p>
          {/* Konten manajemen pengguna akan ditambahkan di sini */}
        </CardContent>
      </Card>
    </div>
  );
}
