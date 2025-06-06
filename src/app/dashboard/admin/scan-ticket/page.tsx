
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabaseClient";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import type { Booking } from "@/lib/types";
import { QrCode, Search, TicketCheck, UserCircle, CalendarDays, CheckCircle, XCircle, AlertCircle, Loader2, Video } from "lucide-react";
import React, { useState, useRef, useEffect, useCallback } from "react";

// Idealnya, gunakan pustaka QR scanner seperti react-qr-reader atau html5-qrcode-scanner
// Untuk sekarang, ini hanya placeholder UI

export default function ScanTicketPage() {
  const { toast } = useToast();
  const [ticketIdInput, setTicketIdInput] = useState("");
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<Booking | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isScannerActive, setIsScannerActive] = useState(false);

  // Placeholder untuk logika QR Scanner
  const startScanner = useCallback(async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play(); // Mulai video stream
        }
        setIsScannerActive(true);
        toast({ title: "Kamera Aktif", description: "Arahkan QR code tiket ke kamera." });
        // Di sini Anda akan mengintegrasikan pustaka QR scanner untuk memproses stream dari videoRef.current
        // Contoh: html5QrCode.start(videoRef.current, config, qrCodeSuccessCallback, qrCodeErrorCallback);
        // Untuk demo, kita akan simulasikan scan setelah beberapa detik:
        setTimeout(() => {
            if (isScannerActive) { // Cek apakah scanner masih aktif
                // setScannedData(`dummy-booking-id-${Date.now()}`);
                // setTicketIdInput(`dummy-booking-id-${Date.now()}`);
                // handleValidateTicket(`dummy-booking-id-${Date.now()}`);
                console.log("QR Scanner simulation: Ready to scan.");
            }
        }, 5000);

      } catch (err) {
        console.error("Error accessing camera:", err);
        setHasCameraPermission(false);
        toast({ variant: "destructive", title: "Kamera Error", description: "Tidak dapat mengakses kamera. Pastikan izin telah diberikan." });
        setIsScannerActive(false);
      }
    } else {
      setHasCameraPermission(false);
      toast({ variant: "destructive", title: "Kamera Tidak Didukung", description: "Browser Anda tidak mendukung akses kamera." });
    }
  }, [isScannerActive, toast]); // Tambahkan isScannerActive ke dependency

  const stopScanner = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScannerActive(false);
    // toast({ title: "Kamera Dinonaktifkan" });
  }, []);

  useEffect(() => {
    // Cleanup: Hentikan scanner jika komponen unmount atau isScannerActive menjadi false
    return () => {
      if (isScannerActive) {
        stopScanner();
      }
    };
  }, [isScannerActive, stopScanner]);


  const handleValidateTicket = async (idToValidate?: string) => {
    const finalTicketId = idToValidate || ticketIdInput;
    if (!finalTicketId.trim()) {
      toast({ variant: "destructive", title: "Input Kosong", description: "Masukkan ID Tiket atau scan QR Code." });
      return;
    }

    setIsLoading(true);
    setValidationError(null);
    setValidationResult(null);

    try {
      // Di dunia nyata, ini akan memanggil Supabase Edge Function
      // const { data, error } = await supabase.functions.invoke('validate-ticket', { body: { bookingId: finalTicketId } });
      
      // Simulasi panggilan ke Supabase
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', finalTicketId)
        .single();

      if (error || !data) {
        throw new Error(error?.message || "Tiket tidak ditemukan.");
      }
      
      const bookingData = data as Booking;

      if (bookingData.payment_status !== 'paid') {
        setValidationError(`Tiket belum lunas (Status: ${bookingData.payment_status}).`);
        setValidationResult(bookingData); // Tetap tampilkan info tiketnya
      } else if (bookingData.checked_in) {
        setValidationError(`Tiket ini sudah digunakan (Check-in pada: ${bookingData.checked_in_at ? new Date(bookingData.checked_in_at).toLocaleString('id-ID') : 'N/A'}).`);
        setValidationResult(bookingData);
      } else {
        setValidationResult(bookingData);
        toast({ title: "Tiket Valid!", description: `Tiket untuk ${bookingData.userName} siap untuk check-in.` });
      }
      stopScanner(); // Hentikan scanner setelah validasi berhasil atau gagal
    } catch (err: any) {
      setValidationError(err.message || "Gagal memvalidasi tiket.");
      toast({ variant: "destructive", title: "Validasi Gagal", description: err.message });
      stopScanner();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckInTicket = async () => {
    if (!validationResult || validationResult.checked_in || validationResult.payment_status !== 'paid') {
      toast({ variant: "destructive", title: "Tidak Dapat Check-in", description: "Tiket tidak valid untuk check-in." });
      return;
    }

    setIsCheckingIn(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ checked_in: true, checked_in_at: new Date().toISOString() })
        .eq('id', validationResult.id);

      if (error) {
        throw error;
      }

      setValidationResult({ ...validationResult, checked_in: true, checked_in_at: new Date().toISOString() });
      toast({ title: "Check-in Berhasil!", description: `Tiket ${validationResult.id} telah berhasil di check-in.` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Check-in", description: err.message });
    } finally {
      setIsCheckingIn(false);
    }
  };


  return (
    <div className="container py-12 space-y-8">
      <Card className="shadow-xl">
        <CardHeader className="bg-primary text-primary-foreground p-6 rounded-t-lg">
          <div className="flex items-center gap-3">
            <QrCode className="h-10 w-10" />
            <div>
              <CardTitle className="text-3xl font-bold">Validasi Tiket</CardTitle>
              <CardDescription className="text-primary-foreground/80">
                Scan QR Code tiket atau masukkan ID Tiket untuk validasi.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          
          {/* Camera Scanner Section */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Scan QR Code Tiket</h3>
             {!isScannerActive ? (
                <Button onClick={startScanner} variant="outline" className="w-full md:w-auto">
                    <Video className="mr-2 h-4 w-4" /> Aktifkan Kamera Scanner
                </Button>
            ) : (
                 <Button onClick={stopScanner} variant="destructive" className="w-full md:w-auto">
                    <Video className="mr-2 h-4 w-4" /> Nonaktifkan Kamera
                </Button>
            )}

            {hasCameraPermission === false && (
                <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Akses Kamera Ditolak</AlertTitle>
                    <AlertDescription>
                        Silakan berikan izin akses kamera di pengaturan browser Anda untuk menggunakan fitur scan QR.
                    </AlertDescription>
                </Alert>
            )}
            {isScannerActive && (
              <div className="mt-2 border bg-muted rounded-md overflow-hidden aspect-video max-w-md mx-auto">
                <video ref={videoRef} className="w-full h-full object-cover" playsInline />
              </div>
            )}
            {scannedData && <p className="text-sm text-muted-foreground">Data dari QR: {scannedData}</p>}
          </div>

          <Separator />

          {/* Manual Input Section */}
          <div className="space-y-2">
            <Label htmlFor="ticketId" className="text-lg font-semibold">Masukkan ID Tiket Manual</Label>
            <div className="flex items-center gap-2">
              <Input
                id="ticketId"
                placeholder="Contoh: bk_xxxxxxx atau hasil scan QR"
                value={ticketIdInput}
                onChange={(e) => setTicketIdInput(e.target.value)}
                disabled={isLoading}
              />
              <Button onClick={() => handleValidateTicket()} disabled={isLoading || !ticketIdInput.trim()}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                Validasi
              </Button>
            </div>
          </div>

          {/* Validation Result Section */}
          {validationResult && (
            <Card className={`mt-4 ${validationResult.checked_in || validationError ? 'border-yellow-400 bg-yellow-50' : 'border-green-400 bg-green-50'}`}>
              <CardHeader>
                <CardTitle className={`flex items-center ${validationResult.checked_in || validationError ? 'text-yellow-700' : 'text-green-700'}`}>
                  {validationResult.checked_in ? <AlertCircle className="mr-2 h-6 w-6"/> : validationError && validationResult.payment_status !== 'paid' ? <XCircle className="mr-2 h-6 w-6"/> : <CheckCircle className="mr-2 h-6 w-6" />}
                  Status Tiket: {validationResult.checked_in ? "Sudah Digunakan" : validationError && validationResult.payment_status !== 'paid' ? "Belum Lunas" : validationError ? "Sudah Digunakan (Lainnya)" : "VALID"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><UserCircle className="inline mr-1 h-4 w-4" /><strong>Nama Pembeli:</strong> {validationResult.userName}</p>
                <p><TicketCheck className="inline mr-1 h-4 w-4" /><strong>Acara:</strong> {validationResult.eventName}</p>
                <p><CalendarDays className="inline mr-1 h-4 w-4" /><strong>Tanggal Pesan:</strong> {new Date(validationResult.bookingDate).toLocaleString('id-ID')}</p>
                <p><strong>ID Pesanan:</strong> {validationResult.id}</p>
                <p><strong>Status Pembayaran:</strong> <span className={`font-semibold ${validationResult.payment_status === 'paid' ? 'text-green-600' : 'text-red-600'}`}>{validationResult.payment_status.toUpperCase()}</span></p>
                {validationError && <p className="text-red-600 font-semibold">{validationError}</p>}
                
                {!validationResult.checked_in && validationResult.payment_status === 'paid' && !validationError && (
                  <Button onClick={handleCheckInTicket} disabled={isCheckingIn} className="mt-4 w-full bg-green-600 hover:bg-green-700">
                    {isCheckingIn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                    Konfirmasi Check-in Tiket Ini
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
           {validationError && !validationResult && ( // Error tanpa hasil validasi (mis. tiket tidak ditemukan sama sekali)
             <Alert variant="destructive" className="mt-4">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Error Validasi</AlertTitle>
                <AlertDescription>{validationError}</AlertDescription>
            </Alert>
           )}
        </CardContent>
      </Card>
    </div>
  );
}

