
# Daftar Tugas Pengembangan Bproid.com

Ini adalah daftar tugas yang lebih detail berdasarkan rencana pengembangan. Tandai item sebagai selesai ([x]) saat dikerjakan.

## Fase 1: Inti Platform Tiket & Manajemen Pengguna Dasar (Supabase & Midtrans)

### Database (Supabase)
-   [ ] **Skema & Tabel:**
    -   [x] Buat tabel `events` (dengan kolom `id`, `name`, `date`, `location`, `price_tiers` (jsonb), `description`, `image_url`, `organizer`, `category`, `available_tickets`, `created_at`, `updated_at`).
    -   [x] Buat tabel `users` (profil publik: `id` (FK ke `auth.users.id`), `name`, `email`, `avatar_url`, `roles` (jsonb), `account_status`, `join_date`, `last_login`, `total_purchases`, `tickets_purchased`, `affiliate_code`, `bank_details` (jsonb), `created_at`, `updated_at`).
    -   [x] Buat tabel `coupons` (`id`, `code`, `discount_type`, `discount_value`, `expiry_date`, `is_active`, `usage_limit`, `times_used`, `min_purchase`, `description`, `created_at`, `updated_at`).
    -   [x] Buat tabel `bookings` (`id`, `event_id` (FK), `user_id` (FK), `event_name`, `user_name`, `user_email`, `tickets`, `total_price`, `booking_date`, `payment_status` (`pending`, `paid`, `failed`, `expired`), `coupon_id` (FK), `coupon_code`, `discount_amount`, `selected_tier_name`, `selected_tier_price`, `used_referral_code`, `buyer_referral_code`, `ticket_pdf_url`, `midtrans_token` (opsional), `midtrans_redirect_url` (opsional), `midtrans_order_id`, `checked_in` (boolean, default false), `checked_in_at` (timestamptz), `created_at`, `updated_at`).
-   [x] **Row Level Security (RLS):**
    -   [x] Terapkan RLS awal untuk tabel `events`.
    -   [x] Terapkan RLS untuk tabel `users`.
    -   [x] Terapkan RLS untuk tabel `coupons`.
    -   [x] Terapkan RLS untuk tabel `bookings`.
-   [x] **Fungsi & Trigger Database:**
    -   [x] Implementasikan DB Function `handle_new_user` dan Trigger untuk menyinkronkan `auth.users` ke `public.users`.
-   [x] **Supabase Storage:**
    -   [x] Buat bucket `bproid-tickets` (atau nama serupa) untuk menyimpan PDF tiket. (MANUAL CLI/UI - See migration `20250607160700_setup_storage_bucket.sql`)
    -   [x] Atur policies untuk bucket (misalnya, service_role bisa tulis, publik bisa baca). (MANUAL CLI/UI - See migration `20250607160700_setup_storage_bucket.sql`)

### Autentikasi (Supabase Auth)
-   [ ] **Frontend:**
    -   [x] Buat komponen/halaman untuk Login Pengguna. (Already implemented in `src/app/login/page.tsx`)
    -   [x] Buat komponen/halaman untuk Registrasi Pengguna. (Already implemented in `src/app/register/page.tsx`)
    -   [x] Implementasikan logika Logout. (Implemented in `src/components/layout/Header.tsx`)
    -   [x] Lindungi rute yang memerlukan autentikasi. (Implemented in `src/middleware.ts`)
    -   [x] Tampilkan status login/profil pengguna di header. (Implemented in `src/components/layout/Header.tsx`)

### Frontend (Next.js) - Fitur Pengguna
-   [ ] **Halaman Utama (`/`)**:
    -   [x] Ambil dan tampilkan daftar acara dari Supabase.
-   [ ] **Halaman Detail Acara (`/events/[id]`)**:
    -   [x] Ambil dan tampilkan detail acara spesifik dari Supabase.
-   [x] **Formulir Pemesanan (`BookingForm.tsx`)**:
    -   [x] Ambil detail kupon dari Supabase untuk validasi.
    -   [x] Panggil Supabase Edge Function `initiate-payment`. (Implemented in `BookingForm.tsx`)
    -   [x] Tangani respons (token/URL Midtrans) dari Edge Function. (Implemented in `BookingForm.tsx`)
    -   [x] **Integrasikan Midtrans Snap.js**: Gunakan token untuk membuka popup pembayaran Midtrans. (Implemented in `BookingForm.tsx`)
    -   [x] Tangani callback sukses/pending/error/close dari Midtrans Snap.js. (Implemented in `BookingForm.tsx`)
    -   [x] Arahkan ke halaman konfirmasi yang sesuai atau tampilkan pesan. (Implemented in `BookingForm.tsx`)
-   [ ] **Halaman Konfirmasi Pemesanan (`/booking/confirmation/[bookingId]`)**:
    -   [x] Tampilkan status berdasarkan parameter URL (mis., `?status=success` atau `?status=pending`).
    -   [x] Tampilkan pesan yang sesuai (mis., "Pembayaran berhasil, e-tiket dikirim" atau "Menunggu pembayaran").
-   [x] **Halaman Tiket Saya (`/my-tickets`)**:
    -   [x] Ambil dan tampilkan daftar tiket dari `bookings` milik pengguna yang login. (Implemented in `src/app/my-tickets/page.tsx`)
    -   [x] Pastikan tombol "Unduh E-Tiket" berfungsi jika `ticket_pdf_url` ada. (Implemented in `src/app/my-tickets/page.tsx`)
-   [x] **Halaman Pengaturan Pengguna (`/dashboard/user/settings`)**:
    -   [x] Ambil data profil dari `users` Supabase. (Implemented in `src/app/dashboard/user/settings/page.tsx`)
    -   [x] Izinkan update nama, avatar, detail bank ke `users` Supabase. (Implemented in `src/app/dashboard/user/settings/page.tsx`)

### Backend (Supabase Edge Functions)
-   [ ] **`initiate-payment` Edge Function:**
    -   [x] Terima payload dari frontend.
    -   [x] Validasi ketersediaan tiket & harga dari `events`.
    -   [x] Validasi kupon dari `coupons`.
    -   [x] Hitung harga akhir.
    -   [x] Simpan pesanan awal ke `bookings` dengan `payment_status = 'pending'`.
    -   [x] **Panggil API Midtrans**: Untuk membuat transaksi dan mendapatkan `token` atau `redirect_url`. (Simpan Midtrans Server Key & Client Key sebagai secrets). (Implemented in `supabase/functions/initiate-payment/index.ts`)
    -   [x] Kembalikan `token`/`redirect_url` Midtrans ke frontend.
-   [x] **`midtrans-webhook` Edge Function:**
    -   [x] Buat endpoint untuk menerima notifikasi dari Midtrans. (Implemented in `supabase/functions/midtrans-webhook/index.ts`)
    -   [x] **Implementasikan verifikasi signature Midtrans** (SANGAT PENTING). (Implemented in `supabase/functions/midtrans-webhook/index.ts`)
    -   [x] Proses status transaksi: (Implemented in `supabase/functions/midtrans-webhook/index.ts`)
        -   Jika `settlement` (sukses):
            -   [x] Update `payment_status = 'paid'` di `bookings`. (Implemented)
            -   [x] Update `times_used` di `coupons` (jika dipakai). (Implemented)
            -   [x] Update `available_tickets` di `events`. (Implemented)
            -   [x] Generate `buyer_referral_code` dan simpan ke `bookings`. (Implemented)
            -   [x] **Panggil fungsi untuk generate PDF E-Tiket** (dengan QR code dari `bookingId`). (Implemented)
            -   [x] **Simpan PDF ke Supabase Storage** dan update `ticket_pdf_url` di `bookings`. (Implemented)
            -   [x] **Panggil fungsi untuk kirim email** dengan lampiran e-tiket. (Implemented)
            -   [x] (Fase 2) Jika ada `used_referral_code`, hitung & simpan komisi. (Implemented in Phase 2 work)
        -   Handle status `pending`, `failure`, `expire`, `cancel`. (Implemented)
    -   [x] Kembalikan HTTP 200 OK ke Midtrans. (Implemented)
-   [x] **Logika Pembuatan PDF E-Tiket (dalam `midtrans-webhook` atau fungsi helper):**
    -   [x] Fungsi untuk mengambil detail pesanan dan acara. (Implemented in `midtrans-webhook`)
    -   [x] Fungsi untuk men-generate QR code (dari `bookingId`). (Implemented as `generateQRCodeDataURL` in `midtrans-webhook`)
    -   [x] Fungsi untuk men-generate PDF e-tiket yang berisi detail acara, pemesan, dan QR code. (Implemented as `generateTicketPdf` in `midtrans-webhook`)
-   [x] **Logika Pengiriman Email (dalam `midtrans-webhook` atau fungsi helper):**
    -   [x] Integrasi dengan layanan email (Resend, SendGrid, dll. via API HTTP). (Implemented as `sendTicketEmail` in `midtrans-webhook`)
    -   [x] Kirim email dengan lampiran PDF e-tiket. (Implemented in `sendTicketEmail` in `midtrans-webhook`)

### Frontend (Next.js) - Dasbor Admin (Dasar)
-   [x] **Kelola Acara (`/dashboard/admin/manage-events`)**: CRUD ke Supabase.
-   [x] **Kelola Kupon (`/dashboard/admin/coupons`)**: CRUD ke Supabase.
-   [x] **Kelola Pesanan (`/dashboard/admin/orders`)**:
    -   [x] Ambil dan tampilkan daftar pesanan dari `bookings` Supabase. (Implemented in `src/app/dashboard/admin/orders/page.tsx`)
    -   [x] Tambahkan kolom `ticket_pdf_url` (link jika ada) dan `checked_in`. (Implemented in `src/components/dashboard/AdminRecentBookingsTable.tsx`)
-   [x] **Pengaturan Admin (`/dashboard/admin/settings`)**:
    -   [x] Simpan/muat pengaturan ke/dari tabel `admin_settings` (atau solusi lain) di Supabase, bukan localStorage. (Implemented in `src/app/dashboard/admin/settings/page.tsx` and migration `20250607192500_create_admin_settings_table.sql`)
    -   [x] Tambahkan field untuk Midtrans Server Key, Client Key, Production Mode (untuk diakses oleh Edge Functions). (Client Key & Mode informational, Server Key noted as env secret, Mode in DB. Implemented in `src/app/dashboard/admin/settings/page.tsx`)

---

## Fase 2: Implementasi Sistem Afiliasi
(Tugas-tugas dari rencana sebelumnya, pastikan terintegrasi dengan alur pembayaran baru)

### Database (Supabase)
-   [x] Buat tabel `commissions`.
-   [x] Buat tabel `withdrawal_requests`.
-   [x] RLS untuk tabel baru. (Implemented in `20250607205400_apply_rls_to_affiliate_tables.sql`)

### Backend (Supabase Edge Functions/DB Functions)
-   [x] **Peningkatan `midtrans-webhook` Edge Function:**
    -   [x] Jika pembayaran berhasil & `used_referral_code` valid, identifikasi afiliasi, hitung komisi, simpan ke `commissions`. (Implemented)
-   [x] `request-withdrawal` Edge Function. (Implemented)
-   [x] `process-withdrawal` Edge Function (Admin). (Implemented)
-   [x] `activate-affiliate` Edge Function (Admin). (Implemented)

### Frontend (Next.js) - Dasbor Afiliasi (`/dashboard/affiliate`)
-   [x] Statistik, pembuat tautan, daftar penjualan, riwayat penarikan, formulir permintaan. (Implemented in `src/app/dashboard/affiliate/page.tsx`)

### Frontend (Next.js) - Dasbor Admin
-   [x] **Manajemen Afiliasi (`/dashboard/admin/affiliates-management`)**. (Implemented in `src/app/dashboard/admin/affiliates-management/page.tsx`)
-   [x] **Kelola Pengguna (`/dashboard/admin/users`)**: Perbarui untuk peran afiliasi. (Verified: Page displays affiliate roles, codes, and has activate/deactivate actions)

---

## Fase 3: Peningkatan Dasbor Admin & Fitur Validasi Tiket

### Frontend (Next.js) - Dasbor Admin (Peningkatan)
-   [x] Edit Acara, Edit Kupon. (Implemented)
-   [ ] Filter, pencarian, paginasi untuk tabel Pesanan, Pengguna, Acara, Kupon.

### Fitur Validasi Tiket
-   [x] **Frontend - Halaman Scan Tiket Admin (`/dashboard/admin/scan-ticket`)**:
    -   [x] UI dasar: area kamera (placeholder), input manual ID tiket, tombol validasi, area hasil. (Implemented)
    -   [ ] Integrasi pustaka QR scanner untuk menggunakan kamera.
    -   [x] Panggil Edge Function `validate-ticket` saat scan/submit manual. (Implemented)
    -   [x] Tampilkan hasil validasi. (Implemented)
    -   [x] Tombol "Check-in" jika tiket valid dan belum digunakan. (Handled by `validate-ticket` function automatically)
-   [x] **Backend - `validate-ticket` Edge Function**:
    -   [x] Terima `bookingId`. (Implemented)
    -   [x] Query tabel `bookings` berdasarkan `bookingId`. (Implemented)
    -   [x] Periksa `payment_status` (harus `paid`). (Implemented)
    -   [x] Periksa `checked_in` (harus `false`). (Implemented)
    -   [x] Jika valid & belum check-in:
        -   [x] Update `checked_in = true`, `checked_in_at = now()`. (Implemented)
        -   [x] Kembalikan detail booking dan status "VALID_FOR_CHECK_IN". (Returns "success" status)
    -   [x] Jika sudah check-in, kembalikan status "ALREADY_CHECKED_IN" dan detail booking. (Implemented)
    -   [x] Jika tidak lunas, kembalikan status "PAYMENT_NOT_CONFIRMED". (Returns "not_paid")
    -   [x] Jika tidak ditemukan, kembalikan status "INVALID_TICKET". (Returns "not_found")

---

## Fase 4: Pengujian, Deployment, dan Iterasi Berkelanjutan
(Tugas-tugas dari rencana sebelumnya)
-   [ ] Pengujian unit, integrasi, E2E (terutama alur pembayaran dan validasi tiket).
-   [ ] Audit Keamanan (RLS, webhook Midtrans, validasi input).
-   [ ] Deployment (CI/CD, environment variables untuk Midtrans).
-   [ ] Monitoring & Logging.
