
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BadgePercent } from "lucide-react";

export default function CouponsPage() {
  return (
    <div className="container py-12">
      <Card className="mx-auto max-w-3xl shadow-xl">
        <CardHeader className="bg-primary text-primary-foreground p-6 rounded-t-lg">
          <div className="flex items-center gap-3">
            <BadgePercent className="h-10 w-10" />
            <div>
              <CardTitle className="text-3xl font-bold">Kelola Kupon</CardTitle>
              <CardDescription className="text-primary-foreground/80">
                Buat dan kelola kupon diskon untuk acara atau promosi.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <p>Halaman ini akan memungkinkan admin untuk membuat, mengubah, dan menghapus kupon diskon. Admin juga dapat melihat statistik penggunaan kupon.</p>
          {/* Konten manajemen kupon akan ditambahkan di sini */}
        </CardContent>
      </Card>
    </div>
  );
}
