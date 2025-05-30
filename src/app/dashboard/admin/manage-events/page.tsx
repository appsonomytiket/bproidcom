
// src/app/dashboard/admin/manage-events/page.tsx
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
// import { MOCK_EVENTS } from "@/lib/constants"; // No longer primary source
import type { Event } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit3, Trash2, ClipboardList, Eye, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/lib/supabaseClient'; // Import Supabase client

interface FormattedEvent extends Event {
  formattedDate: string;
}

// const LOCAL_STORAGE_EVENTS_KEY = 'bproid_managed_events'; // No longer using localStorage

export default function ManageEventsPage() {
  const [events, setEvents] = useState<FormattedEvent[]>([]);
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        const formatted = data.map((event: Event) => ({ // Explicitly type event
          ...event,
          formattedDate: event.date ? format(new Date(event.date), "PPpp", { locale: idLocale }) : "Tanggal tidak valid",
        }));
        setEvents(formatted);
      } else {
        setEvents([]);
      }
    } catch (error: any) {
      console.error("Gagal memuat acara dari Supabase:", error);
      toast({
        title: "Gagal Memuat Acara",
        description: error.message || "Terjadi masalah saat mengambil data acara.",
        variant: "destructive",
      });
      // Fallback or set to empty:
      // setEvents(MOCK_EVENTS.map(event => ({...event, formattedDate: format(new Date(event.date), "PPpp", { locale: idLocale }) })));
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleEditEvent = (id: string) => {
    console.log("Edit Acara:", id);
    toast({
      title: "Fungsi Belum Tersedia",
      description: `Fungsionalitas Edit Acara ${id} belum diimplementasikan. Ini akan memerlukan formulir edit dan update ke Supabase.`,
    });
    // router.push(`/dashboard/admin/manage-events/edit/${id}`); // Future route
  };

  const handleDeleteEvent = async (id: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus acara ini (ID: ${id})? Tindakan ini akan menghapusnya dari database.`)) {
      try {
        const { error } = await supabase
          .from('events')
          .delete()
          .match({ id: id });

        if (error) {
          throw error;
        }

        loadEvents(); // Reload events from Supabase
        toast({
          title: "Acara Dihapus",
          description: "Acara telah berhasil dihapus dari database.",
        });
      } catch (error: any) {
        console.error("Gagal menghapus acara dari Supabase:", error);
        toast({
          title: "Gagal Menghapus",
          description: error.message || "Terjadi masalah saat menghapus acara.",
          variant: "destructive",
        });
      }
    }
  };

  // const handleResetEvents = () => { // This function is less relevant with a real DB
  //   if (confirm("Apakah Anda yakin ingin mereset semua acara ke daftar awal? Semua acara yang ditambahkan atau diubah secara lokal akan hilang.")) {
  //     localStorage.setItem(LOCAL_STORAGE_EVENTS_KEY, JSON.stringify(MOCK_EVENTS));
  //     loadEvents();
  //     toast({
  //       title: "Acara Direset",
  //       description: "Daftar acara telah dikembalikan ke kondisi awal.",
  //     });
  //   }
  // };

  if (loading) {
    return (
      <div className="container flex min-h-[calc(100vh-10rem)] items-center justify-center py-12 text-center">
        <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
        <p className="text-xl font-semibold">Memuat acara dari database...</p>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-primary flex items-center">
          <ClipboardList className="mr-3 h-8 w-8" />
          Kelola Acara
        </h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
           {/* <Button onClick={handleResetEvents} variant="outline" className="w-full sm:w-auto">
            <RotateCcw className="mr-2 h-5 w-5" />
            Reset ke Acara Default
          </Button> */}
          <Button asChild className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
            <Link href="/dashboard/admin/manage-events/new">
              <PlusCircle className="mr-2 h-5 w-5" />
              Tambah Acara Baru
            </Link>
          </Button>
        </div>
      </div>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>Daftar Acara</CardTitle>
          <CardDescription>Lihat dan kelola semua acara yang terdaftar di database.</CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p>Tidak ada acara yang ditemukan di database. Coba tambahkan acara baru.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Acara</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Lokasi</TableHead>
                  <TableHead className="text-right">Harga (Rp)</TableHead>
                  <TableHead className="text-center">Tiket Tersedia</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.name}</TableCell>
                    <TableCell>{event.formattedDate}</TableCell>
                    <TableCell>{event.location}</TableCell>
                    <TableCell className="text-right">
                      {event.priceTiers && event.priceTiers.length > 0 
                        ? `Rp ${event.priceTiers[0].price.toLocaleString()}`
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-center">{event.availableTickets}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center space-x-2">
                        <Button variant="outline" size="icon" asChild>
                          <Link href={`/events/${event.id}`} target="_blank" title="Lihat Halaman Publik">
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">Lihat Halaman Publik</span>
                          </Link>
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleEditEvent(event.id)} title="Edit Acara">
                          <Edit3 className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button variant="destructive" size="icon" onClick={() => handleDeleteEvent(event.id)} title="Hapus Acara">
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Hapus</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
