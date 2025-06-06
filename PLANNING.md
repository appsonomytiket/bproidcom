
# Rencana Pengembangan Bproid.com

Dokumen ini menguraikan rencana pengembangan tingkat tinggi untuk aplikasi Bproid.com, dibagi menjadi beberapa fase.

## Fase 1: Inti Platform Tiket & Manajemen Pengguna Dasar (Supabase)

**Tujuan**: Membangun fungsionalitas inti untuk pencarian acara, pemesanan tiket (dasar, tanpa payment gateway), dan manajemen pengguna dasar menggunakan Supabase.

**Fitur Utama**:
1.  **Database (Supabase)**:
    *   Finalisasi dan implementasi skema tabel untuk `events`, `users` (profil publik), `coupons`, `bookings`. (Perlu ditambahkan kolom untuk Midtrans & check-in).
    *   Implementasi Row Level Security (RLS) yang kuat untuk semua tabel.
    *   Setup Database Function/Trigger untuk sinkronisasi `auth.users` ke `public.users`.
2.  **Autentikasi (Supabase Auth)**:
    *   Implementasi alur registrasi, login, dan logout pengguna.
3.  **Frontend (Next.js)**:
    *   Halaman Beranda: Menampilkan daftar acara dari Supabase.
    *   Halaman Detail Acara: Menampilkan detail lengkap acara dari Supabase.
    *   Formulir Pemesanan:
        *   Integrasi dengan Supabase untuk validasi kupon.
        *   Memanggil Supabase Edge Function `initiate-payment` (sebelumnya `create-booking`).
    *   Halaman Konfirmasi Pemesanan: Menampilkan status berdasarkan respons Midtrans (via parameter URL atau state sementara).
    *   Halaman "Tiket Saya": Pengguna dapat melihat tiket yang telah mereka pesan dari Supabase.
    *   Halaman Pengaturan Pengguna: Pengguna dapat memperbarui profil (disimpan ke tabel `users` publik di Supabase).
4.  **Backend (Supabase Edge Functions)**:
    *   Implementasi Edge Function `initiate-payment`:
        *   Validasi ketersediaan tiket & harga tier.
        *   Validasi kupon (keaktifan, kedaluwarsa, batas penggunaan, min. pembelian).
        *   Perhitungan harga akhir.
        *   Penyimpanan data pesanan awal ke tabel `bookings` dengan status `pending`.
        *   **Integrasi dengan Midtrans**: Membuat transaksi di Midtrans dan mendapatkan token/URL redirect.
        *   Mengembalikan token/URL Midtrans ke frontend.
    *   Implementasi Edge Function `midtrans-webhook`:
        *   Menerima notifikasi dari Midtrans.
        *   **Verifikasi signature Midtrans.**
        *   Jika pembayaran berhasil (`settlement`):
            *   Update `payment_status` di `bookings` menjadi `paid`.
            *   Update `times_used` pada kupon (jika digunakan).
            *   Update `available_tickets` pada acara.
            *   Generate `buyer_referral_code`.
            *   **Pembuatan PDF E-Tiket dengan QR Code** (berisi `bookingId`).
            *   Simpan PDF ke Supabase Storage dan update `ticket_pdf_url` di `bookings`.
            *   **Kirim email ke pemesan dengan lampiran e-tiket PDF.**
            *   (Opsional) Hitung dan catat komisi afiliasi.
        *   Handle status pembayaran lain dari Midtrans.
5.  **Dasbor Admin (Dasar)**:
    *   Tampilan daftar acara dari Supabase (`manage-events`).
    *   Formulir tambah acara baru yang menyimpan ke Supabase.
    *   Fungsi hapus acara dari Supabase.
    *   Tampilan daftar kupon & formulir tambah kupon baru (tersimpan di Supabase).
    *   Tampilan daftar pesanan dari Supabase.

**Perkiraan Waktu**: 5-8 Minggu (Dengan asumsi 1-2 developer fokus, kompleksitas Midtrans & PDF menambah waktu)

---

## Fase 2: Implementasi Sistem Afiliasi

**Tujuan**: Mengembangkan fungsionalitas sistem afiliasi secara penuh.

**Fitur Utama**:
1.  **Database (Supabase)**:
    *   Desain dan implementasi tabel `commissions` dan `withdrawal_requests`.
    *   RLS untuk tabel baru.
2.  **Backend (Supabase Edge Functions/DB Functions)**:
    *   Peningkatan Edge Function `midtrans-webhook`:
        *   Jika pembayaran berhasil dan `used_referral_code` ada dan valid, hitung komisi berdasarkan aturan yang ditentukan.
        *   Simpan komisi ke tabel `commissions` dengan status `pending`.
    *   Edge Function `request-withdrawal`: Afiliasi meminta penarikan saldo.
    *   Edge Function `process-withdrawal`: Admin menyetujui/menolak permintaan penarikan.
    *   Edge Function `activate-affiliate`: Admin dapat secara manual mengaktifkan pengguna sebagai afiliasi.
3.  **Frontend - Dasbor Afiliasi**:
    *   Statistik performa.
    *   Alat pembuat tautan afiliasi.
    *   Daftar penjualan referral dan komisi.
    *   Riwayat penarikan & formulir permintaan penarikan.
4.  **Frontend - Dasbor Admin**:
    *   Halaman Manajemen Afiliasi.

**Perkiraan Waktu**: 3-5 Minggu

---

## Fase 3: Peningkatan Dasbor Admin & Fitur Validasi Tiket

**Tujuan**: Menyempurnakan dasbor admin dan menambahkan fitur validasi tiket QR.

**Fitur Utama**:
1.  **Frontend - Dasbor Admin (Peningkatan)**:
    *   Fungsionalitas Edit untuk Acara dan Kupon.
    *   Filter, pencarian, dan paginasi untuk tabel Pesanan, Pengguna, Acara, Kupon.
    *   Manajemen peran pengguna yang lebih detail.
2.  **Frontend - Fitur Validasi Tiket Admin (`/dashboard/admin/scan-ticket`)**:
    *   Antarmuka untuk memindai QR code dari e-tiket (menggunakan kamera perangkat).
    *   Input manual ID tiket sebagai alternatif.
    *   Menampilkan detail tiket yang divalidasi: nama pemesan, acara, status (valid, sudah check-in, tidak valid).
    *   Tombol untuk "Check-in" tiket yang valid.
3.  **Backend - Edge Function `validate-ticket`**:
    *   Menerima `bookingId` (dari QR code atau input manual).
    *   Memeriksa status booking di tabel `bookings` (apakah `paid` dan belum `checked_in`).
    *   Jika valid dan belum check-in, update `checked_in = true` dan `checked_in_at = now()`.
    *   Mengembalikan status validasi ke frontend admin.
4.  **Frontend - Pengguna**:
    *   Tombol "Unduh E-Tiket" di halaman "Tiket Saya" menjadi fungsional (mengarah ke `ticket_pdf_url` dari Supabase Storage).

**Perkiraan Waktu**: 3-6 Minggu

---

## Fase 4: Pengujian, Deployment, dan Iterasi Berkelanjutan

**Tujuan**: Memastikan kualitas, keamanan, dan keandalan aplikasi sebelum dan setelah peluncuran.

**Fitur Utama**:
1.  **Pengujian Komprehensif**: Unit, integrasi, E2E.
2.  **Audit Keamanan**: Review RLS, validasi input, proteksi webhook.
3.  **Optimasi Kinerja**.
4.  **Deployment**: CI/CD, hosting frontend, deploy Supabase Functions & migrasi DB.
5.  **Monitoring & Pemeliharaan**.
6.  **Iterasi**: Feedback pengguna, fitur baru.

**Perkiraan Waktu**: Berkelanjutan

---

## Pertimbangan Umum Sepanjang Proyek

*   **Pengalaman Pengguna (UX/UI)**: Prioritaskan antarmuka yang intuitif.
*   **Keamanan**: Praktik terbaik di semua lapisan.
*   **Skalabilitas**: Desain query dan fungsi yang efisien.
*   **Penanganan Error**: Implementasi yang baik.
*   **Dokumentasi**: Jaga tetap terbaru.
*   **Midtrans Environment**: Gunakan Sandbox Midtrans untuk pengembangan dan Production untuk live. Simpan Server Key dan Client Key dengan aman sebagai secrets di Supabase.

