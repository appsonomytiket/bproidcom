
// src/app/dashboard/admin/manage-events/page.tsx
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MOCK_EVENTS } from "@/lib/constants";
import type { Event } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit3, Trash2, ClipboardList } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface FormattedEvent extends Event {
  formattedDate: string;
}

export default function ManageEventsPage() {
  const [events, setEvents] = useState<FormattedEvent[]>([]);

  useEffect(() => {
    // Simulate fetching events - in a real app, this might also check localStorage or an API
    const currentEvents = MOCK_EVENTS; // In a real app, this would be fetched or managed state

    const formatted = currentEvents.map(event => ({
      ...event,
      formattedDate: format(new Date(event.date), "PPpp", { locale: idLocale }),
    }));
    setEvents(formatted);
  }, []);


  const handleEditEvent = (id: string) => {
    // Placeholder for edit event functionality
    console.log("Edit Acara:", id);
    alert(`Fungsionalitas Edit Acara ${id} belum diimplementasikan.`);
  };

  const handleDeleteEvent = (id: string) => {
    // Placeholder for delete event functionality
    console.log("Hapus Acara:", id);
    if (confirm(`Apakah Anda yakin ingin menghapus acara ${id}?`)) {
      alert(`Fungsionalitas Hapus Acara ${id} belum diimplementasikan.`);
      // In a real app, you would call an API to delete the event
      // and then update the local state:
      // setEvents(prevEvents => prevEvents.filter(event => event.id !== id));
    }
  };

  return (
    <div className="container py-12">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary flex items-center">
          <ClipboardList className="mr-3 h-8 w-8" />
          Kelola Acara
        </h1>
        <Button asChild className="bg-primary hover:bg-primary/90">
          <Link href="/dashboard/admin/manage-events/new">
            <PlusCircle className="mr-2 h-5 w-5" />
            Tambah Acara Baru
          </Link>
        </Button>
      </div>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>Daftar Acara</CardTitle>
          <CardDescription>Lihat dan kelola semua acara yang terdaftar.</CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p>Memuat daftar acara atau tidak ada acara yang ditemukan.</p>
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
                    <TableCell className="text-right">{event.price.toLocaleString()}</TableCell>
                    <TableCell className="text-center">{event.availableTickets}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditEvent(event.id)}>
                          <Edit3 className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteEvent(event.id)}>
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
