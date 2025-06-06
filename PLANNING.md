
# Rencana Pengembangan Bproid.com

Dokumen ini menguraikan rencana pengembangan tingkat tinggi untuk aplikasi Bproid.com, dibagi menjadi beberapa fase.

## Fase 1: Inti Platform Tiket & Manajemen Pengguna Dasar

**Tujuan**: Membangun fungsionalitas inti untuk pencarian acara, pemesanan tiket, dan manajemen pengguna dasar menggunakan Supabase.

**Fitur Utama**:
1.  **Database (Supabase)**:
    *   Finalisasi dan implementasi skema tabel untuk `events`, `users` (profil publik), `coupons`, `bookings`.
    *   Implementasi Row Level Security (RLS) yang kuat untuk semua tabel.
    *   Setup Database Function/Trigger untuk sinkronisasi `auth.users` ke `public.users`.
2.  **Autentikasi (Supabase Auth)**:
    *   Implementasi alur registrasi, login, dan logout pengguna.
3.  **Frontend (Next.js)**:
    *   Halaman Beranda: Menampilkan daftar acara dari Supabase.
    *   Halaman Detail Acara: Menampilkan detail lengkap acara dari Supabase.
    *   Formulir Pemesanan:
        *   Integrasi dengan Supabase untuk validasi kupon.
        *   Memanggil Supabase Edge Function `create-booking`.
    *   Halaman Konfirmasi Pemesanan: Menampilkan ringkasan berdasarkan respons dari Edge Function.
    *   Halaman "Tiket Saya": Pengguna dapat melihat tiket yang telah mereka pesan dari Supabase.
    *   Halaman Pengaturan Pengguna: Pengguna dapat memperbarui profil (disimpan ke tabel `users` publik di Supabase).
4.  **Backend (Supabase Edge Functions)**:
    *   Implementasi Edge Function `create-booking`:
        *   Validasi ketersediaan tiket & harga tier.
        *   Validasi kupon (keaktifan, kedaluwarsa, batas penggunaan, min. pembelian).
        *   Perhitungan harga akhir.
        *   Penyimpanan data pesanan ke tabel `bookings`.
        *   Pembaruan `times_used` pada kupon.
        *   Pengurangan `available_tickets` pada acara.
        *   Pembuatan kode referral untuk pembeli.
5.  **Dasbor Admin (Dasar)**:
    *   Tampilan daftar acara dari Supabase (`manage-events`).
    *   Formulir tambah acara baru yang menyimpan ke Supabase.
    *   Fungsi hapus acara dari Supabase.
    *   Tampilan daftar kupon & formulir tambah kupon baru (tersimpan di Supabase).
    *   Tampilan daftar pesanan dari Supabase.

**Perkiraan Waktu**: 4-6 Minggu (Dengan asumsi 1-2 developer fokus)

---

## Fase 2: Implementasi Sistem Afiliasi

**Tujuan**: Mengembangkan fungsionalitas sistem afiliasi secara penuh.

**Fitur Utama**:
1.  **Database (Supabase)**:
    *   Desain dan implementasi tabel `commissions` dan `withdrawal_requests`.
    *   RLS untuk tabel baru.
2.  **Backend (Supabase Edge Functions/DB Functions)**:
    *   Peningkatan Edge Function `create-booking`:
        *   Jika `used_referral_code` ada dan valid, hitung komisi berdasarkan aturan yang ditentukan.
        *   Simpan komisi ke tabel `commissions` dengan status `pending`.
        *   (Opsional) Update total saldo tertunda afiliasi di tabel `users`.
    *   Edge Function `request-withdrawal`: Afiliasi meminta penarikan saldo.
    *   Edge Function `process-withdrawal`: Admin menyetujui/menolak permintaan penarikan.
    *   Edge Function `activate-affiliate`: Admin dapat secara manual mengaktifkan pengguna sebagai afiliasi dan men-generate kode referral jika belum ada.
3.  **Frontend - Dasbor Afiliasi**:
    *   Statistik performa (klik, konversi, total komisi - data awal bisa mock/placeholder).
    *   Alat pembuat tautan afiliasi untuk acara spesifik.
    *   Daftar penjualan referral dan komisi yang diperoleh.
    *   Riwayat penarikan & formulir permintaan penarikan.
    *   Tampilan kode referral utama afiliasi.
4.  **Frontend - Dasbor Admin**:
    *   Halaman Manajemen Afiliasi:
        *   Daftar semua pengguna dengan status afiliasi.
        *   Tampilan permintaan penarikan dengan opsi untuk menyetujui/menolak.
        *   Kemampuan untuk secara manual mengaktifkan/menonaktifkan status afiliasi pengguna.

**Perkiraan Waktu**: 3-5 Minggu

---

## Fase 3: Peningkatan Dasbor Admin & Integrasi Pembayaran

**Tujuan**: Menyempurnakan dasbor admin, mengintegrasikan gateway pembayaran, dan mengotomatisasi pembuatan e-tiket.

**Fitur Utama**:
1.  **Integrasi Gateway Pembayaran (Contoh: Midtrans, Xendit)**:
    *   Frontend: Integrasi SDK/UI Kit dari payment gateway ke alur pemesanan.
    *   Backend: Supabase Edge Function untuk menangani notifikasi/webhook dari payment gateway untuk mengkonfirmasi pembayaran dan memperbarui status pesanan di tabel `bookings` menjadi `paid`.
2.  **Pembuatan E-Tiket & Pengiriman Email**:
    *   Backend: Setelah pembayaran dikonfirmasi (via webhook), picu Edge Function untuk:
        *   Menghasilkan PDF e-tiket (termasuk detail acara, pemesan, dan QR code unik untuk validasi).
        *   Menyimpan PDF ke Supabase Storage.
        *   Memperbarui tabel `bookings` dengan URL ke PDF e-tiket.
        *   Mengirim email ke pemesan dengan lampiran e-tiket PDF atau tautan unduh.
3.  **Frontend - Dasbor Admin (Peningkatan)**:
    *   Fungsionalitas Edit untuk Acara dan Kupon.
    *   Filter, pencarian, dan paginasi untuk tabel Pesanan, Pengguna, Acara, Kupon.
    *   Manajemen peran pengguna yang lebih detail.
    *   Analitik yang lebih mendalam (jika diperlukan).
4.  **Frontend - Pengguna**:
    *   Tombol "Unduh E-Tiket" di halaman "Tiket Saya" menjadi fungsional (mengarah ke PDF dari Supabase Storage).

**Perkiraan Waktu**: 4-7 Minggu

---

## Fase 4: Pengujian, Deployment, dan Iterasi Berkelanjutan

**Tujuan**: Memastikan kualitas, keamanan, dan keandalan aplikasi sebelum dan setelah peluncuran.

**Fitur Utama**:
1.  **Pengujian Komprehensif**:
    *   Pengujian unit untuk logika bisnis penting (misalnya di Edge Functions).
    *   Pengujian integrasi untuk alur utama (pemesanan, afiliasi, pembayaran).
    *   Pengujian End-to-End (E2E) menggunakan tools seperti Cypress atau Playwright.
2.  **Audit Keamanan**:
    *   Review RLS policies.
    *   Validasi input di frontend dan backend.
    *   Perlindungan terhadap kerentanan umum web (XSS, SQL Injection - meskipun Supabase banyak membantu).
3.  **Optimasi Kinerja**:
    *   Analisis query database.
    *   Optimasi loading gambar dan aset frontend.
4.  **Deployment**:
    *   Setup CI/CD pipeline (misalnya menggunakan GitHub Actions).
    *   Deploy frontend Next.js (misalnya ke Vercel, Netlify, atau Firebase App Hosting).
    *   Deploy Supabase Edge Functions dan migrasi database.
5.  **Monitoring & Pemeliharaan**:
    *   Setup alat monitoring untuk error dan performa.
    *   Pemeliharaan rutin dan update dependensi.
6.  **Iterasi**:
    *   Kumpulkan feedback pengguna.
    *   Rencanakan dan implementasikan fitur atau perbaikan baru.

**Perkiraan Waktu**: Berkelanjutan

---

## Pertimbangan Umum Sepanjang Proyek

*   **Pengalaman Pengguna (UX/UI)**: Prioritaskan antarmuka yang intuitif, bersih, dan mudah digunakan. Lakukan iterasi desain berdasarkan feedback.
*   **Keamanan**: Terapkan praktik terbaik keamanan di semua lapisan (frontend, backend, database).
*   **Skalabilitas**: Meskipun Supabase menangani banyak aspek skalabilitas, pertimbangkan desain query dan fungsi Anda agar efisien.
*   **Penanganan Error**: Implementasikan penanganan error yang baik di frontend dan backend untuk memberikan feedback yang jelas kepada pengguna dan memudahkan debugging.
*   **Dokumentasi**: Jaga dokumentasi kode dan API tetap terbaru.
