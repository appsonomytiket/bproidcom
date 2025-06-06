
# Daftar Tugas Pengembangan Bproid.com

Ini adalah daftar tugas yang lebih detail berdasarkan rencana pengembangan. Tandai item sebagai selesai ([x]) saat dikerjakan.

## Fase 1: Inti Platform Tiket & Manajemen Pengguna Dasar (Supabase & Midtrans)

### Database (Supabase)
-   [ ] **Skema & Tabel:**
    -   [x] Buat tabel `events` (dengan kolom `id`, `name`, `date`, `location`, `price_tiers` (jsonb), `description`, `image_url`, `organizer`, `category`, `available_tickets`, `created_at`, `updated_at`).
    -   [ ] Buat tabel `users` (profil publik: `id` (FK ke `auth.users.id`), `name`, `email`, `avatar_url`, `roles` (jsonb), `account_status`, `join_date`, `last_login`, `total_purchases`, `tickets_purchased`, `affiliate_code`, `bank_details` (jsonb), `created_at`, `updated_at`).
    -   [ ] Buat tabel `coupons` (`id`, `code`, `discount_type`, `discount_value`, `expiry_date`, `is_active`, `usage_limit`, `times_used`, `min_purchase`, `description`, `created_at`, `updated_at`).
    -   [ ] Buat tabel `bookings` (`id`, `event_id` (FK), `user_id` (FK), `event_name`, `user_name`, `user_email`, `tickets`, `total_price`, `booking_date`, `payment_status` (`pending`, `paid`, `failed`, `expired`), `coupon_id` (FK), `coupon_code`, `discount_amount`, `selected_tier_name`, `selected_tier_price`, `used_referral_code`, `buyer_referral_code`, `ticket_pdf_url`, `midtrans_token` (opsional), `midtrans_redirect_url` (opsional), `midtrans_order_id`, `checked_in` (boolean, default false), `checked_in_at` (timestamptz), `created_at`, `updated_at`).
-   [ ] **Row Level Security (RLS):**
    -   [ ] Terapkan RLS awal untuk tabel `events`.
    -   [ ] Terapkan RLS untuk tabel `users`.
    -   [ ] Terapkan RLS untuk tabel `coupons`.
    -   [ ] Terapkan RLS untuk tabel `bookings`.
-   [x] **Fungsi & Trigger Database:**
    -   [x] Implementasikan DB Function `handle_new_user` dan Trigger untuk menyinkronkan `auth.users` ke `public.users`.
-   [ ] **Supabase Storage:**
    -   [ ] Buat bucket `bproid-tickets` (atau nama serupa) untuk menyimpan PDF tiket.
    -   [ ] Atur policies untuk bucket (misalnya, service_role bisa tulis, publik bisa baca).

### Autentikasi (Supabase Auth)
-   [ ] **Frontend:**
    -   [ ] Buat komponen/halaman untuk Login Pengguna.
    -   [ ] Buat komponen/halaman untuk Registrasi Pengguna.
    -   [ ] Implementasikan logika Logout.
    -   [ ] Lindungi rute yang memerlukan autentikasi.
    -   [ ] Tampilkan status login/profil pengguna di header.

### Frontend (Next.js) - Fitur Pengguna
-   [ ] **Halaman Utama (`/`)**:
    -   [x] Ambil dan tampilkan daftar acara dari Supabase.
-   [ ] **Halaman Detail Acara (`/events/[id]`)**:
    -   [x] Ambil dan tampilkan detail acara spesifik dari Supabase.
-   [ ] **Formulir Pemesanan (`BookingForm.tsx`)**:
    -   [x] Ambil detail kupon dari Supabase untuk validasi.
    -   [ ] Panggil Supabase Edge Function `initiate-payment`.
    -   [ ] Tangani respons (token/URL Midtrans) dari Edge Function.
    -   [ ] **Integrasikan Midtrans Snap.js**: Gunakan token untuk membuka popup pembayaran Midtrans.
    -   [ ] Tangani callback sukses/pending/error/close dari Midtrans Snap.js.
    -   [ ] Arahkan ke halaman konfirmasi yang sesuai atau tampilkan pesan.
-   [ ] **Halaman Konfirmasi Pemesanan (`/booking/confirmation/[bookingId]`)**:
    -   [x] Tampilkan status berdasarkan parameter URL (mis., `?status=success` atau `?status=pending`).
    -   [x] Tampilkan pesan yang sesuai (mis., "Pembayaran berhasil, e-tiket dikirim" atau "Menunggu pembayaran").
-   [ ] **Halaman Tiket Saya (`/my-tickets`)**:
    -   [x] Ambil dan tampilkan daftar tiket dari `bookings` milik pengguna yang login.
    -   [ ] Pastikan tombol "Unduh E-Tiket" berfungsi jika `ticket_pdf_url` ada.
-   [ ] **Halaman Pengaturan Pengguna (`/dashboard/user/settings`)**:
    -   [x] Ambil data profil dari `users` Supabase.
    -   [x] Izinkan update nama, avatar, detail bank ke `users` Supabase.

### Backend (Supabase Edge Functions)
-   [ ] **`initiate-payment` Edge Function:**
    -   [x] Terima payload dari frontend.
    -   [x] Validasi ketersediaan tiket & harga dari `events`.
    -   [x] Validasi kupon dari `coupons`.
    -   [x] Hitung harga akhir.
    -   [x] Simpan pesanan awal ke `bookings` dengan `payment_status = 'pending'`.
    -   [ ] **Panggil API Midtrans**: Untuk membuat transaksi dan mendapatkan `token` atau `redirect_url`. (Simpan Midtrans Server Key & Client Key sebagai secrets).
    -   [x] Kembalikan `token`/`redirect_url` Midtrans ke frontend.
-   [ ] **`midtrans-webhook` Edge Function:**
    -   [ ] Buat endpoint untuk menerima notifikasi dari Midtrans.
    -   [ ] **Implementasikan verifikasi signature Midtrans** (SANGAT PENTING).
    -   [ ] Proses status transaksi:
        -   Jika `settlement` (sukses):
            -   [ ] Update `payment_status = 'paid'` di `bookings`.
            -   [ ] Update `times_used` di `coupons` (jika dipakai).
            -   [ ] Update `available_tickets` di `events`.
            -   [ ] Generate `buyer_referral_code` dan simpan ke `bookings`.
            -   [ ] **Panggil fungsi untuk generate PDF E-Tiket** (dengan QR code dari `bookingId`).
            -   [ ] **Simpan PDF ke Supabase Storage** dan update `ticket_pdf_url` di `bookings`.
            -   [ ] **Panggil fungsi untuk kirim email** dengan lampiran e-tiket.
            -   [ ] (Fase 2) Jika ada `used_referral_code`, hitung & simpan komisi.
        -   Handle status `pending`, `failure`, `expire`, `cancel`.
    -   [ ] Kembalikan HTTP 200 OK ke Midtrans.
-   [ ] **Logika Pembuatan PDF E-Tiket (dalam `midtrans-webhook` atau fungsi helper):**
    -   [x] Fungsi untuk mengambil detail pesanan dan acara.
    -   [x] Fungsi untuk men-generate QR code (dari `bookingId`).
    -   [x] Fungsi untuk men-generate PDF e-tiket yang berisi detail acara, pemesan, dan QR code.
-   [ ] **Logika Pengiriman Email (dalam `midtrans-webhook` atau fungsi helper):**
    -   [x] Integrasi dengan layanan email (Resend, SendGrid, dll. via API HTTP).
    -   [x] Kirim email dengan lampiran PDF e-tiket.

### Frontend (Next.js) - Dasbor Admin (Dasar)
-   [x] **Kelola Acara (`/dashboard/admin/manage-events`)**: CRUD ke Supabase.
-   [x] **Kelola Kupon (`/dashboard/admin/coupons`)**: CRUD ke Supabase.
-   [x] **Kelola Pesanan (`/dashboard/admin/orders`)**:
    -   [x] Ambil dan tampilkan daftar pesanan dari `bookings` Supabase.
    -   [ ] Tambahkan kolom `ticket_pdf_url` (link jika ada) dan `checked_in`.
-   [x] **Pengaturan Admin (`/dashboard/admin/settings`)**:
    -   [ ] Simpan/muat pengaturan ke/dari tabel `admin_settings` (atau solusi lain) di Supabase, bukan localStorage.
    -   [ ] Tambahkan field untuk Midtrans Server Key, Client Key, Production Mode (untuk diakses oleh Edge Functions).

---

## Fase 2: Implementasi Sistem Afiliasi
(Tugas-tugas dari rencana sebelumnya, pastikan terintegrasi dengan alur pembayaran baru)

### Database (Supabase)
-   [ ] Buat tabel `commissions`.
-   [ ] Buat tabel `withdrawal_requests`.
-   [ ] RLS untuk tabel baru.

### Backend (Supabase Edge Functions/DB Functions)
-   [ ] **Peningkatan `midtrans-webhook` Edge Function:**
    -   [ ] Jika pembayaran berhasil & `used_referral_code` valid, identifikasi afiliasi, hitung komisi, simpan ke `commissions`.
-   [ ] `request-withdrawal` Edge Function.
-   [ ] `process-withdrawal` Edge Function (Admin).
-   [ ] `activate-affiliate` Edge Function (Admin).

### Frontend (Next.js) - Dasbor Afiliasi (`/dashboard/affiliate`)
-   [ ] Statistik, pembuat tautan, daftar penjualan, riwayat penarikan, formulir permintaan.

### Frontend (Next.js) - Dasbor Admin
-   [ ] **Manajemen Afiliasi (`/dashboard/admin/affiliates-management`)**.
-   [ ] **Kelola Pengguna (`/dashboard/admin/users`)**: Perbarui untuk peran afiliasi.

---

## Fase 3: Peningkatan Dasbor Admin & Fitur Validasi Tiket

### Frontend (Next.js) - Dasbor Admin (Peningkatan)
-   [ ] Edit Acara, Edit Kupon.
-   [ ] Filter, pencarian, paginasi untuk tabel Pesanan, Pengguna, Acara, Kupon.

### Fitur Validasi Tiket
-   [ ] **Frontend - Halaman Scan Tiket Admin (`/dashboard/admin/scan-ticket`)**:
    -   [x] UI dasar: area kamera (placeholder), input manual ID tiket, tombol validasi, area hasil.
    -   [ ] Integrasi pustaka QR scanner untuk menggunakan kamera.
    -   [ ] Panggil Edge Function `validate-ticket` saat scan/submit manual.
    -   [ ] Tampilkan hasil validasi.
    -   [ ] Tombol "Check-in" jika tiket valid dan belum digunakan.
-   [ ] **Backend - `validate-ticket` Edge Function**:
    -   [ ] Terima `bookingId`.
    -   [ ] Query tabel `bookings` berdasarkan `bookingId`.
    -   [ ] Periksa `payment_status` (harus `paid`).
    -   [ ] Periksa `checked_in` (harus `false`).
    -   [ ] Jika valid & belum check-in:
        -   [ ] Update `checked_in = true`, `checked_in_at = now()`.
        -   [ ] Kembalikan detail booking dan status "VALID_FOR_CHECK_IN".
    -   [ ] Jika sudah check-in, kembalikan status "ALREADY_CHECKED_IN" dan detail booking.
    -   [ ] Jika tidak lunas, kembalikan status "PAYMENT_NOT_CONFIRMED".
    -   [ ] Jika tidak ditemukan, kembalikan status "INVALID_TICKET".

---

## Fase 4: Pengujian, Deployment, dan Iterasi Berkelanjutan
(Tugas-tugas dari rencana sebelumnya)
-   [ ] Pengujian unit, integrasi, E2E (terutama alur pembayaran dan validasi tiket).
-   [ ] Audit Keamanan (RLS, webhook Midtrans, validasi input).
-   [ ] Deployment (CI/CD, environment variables untuk Midtrans).
-   [ ] Monitoring & Logging.

