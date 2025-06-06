
# Daftar Tugas Pengembangan Bproid.com

Ini adalah daftar tugas yang lebih detail berdasarkan rencana pengembangan. Tandai item sebagai selesai ([x]) saat dikerjakan.

## Fase 1: Inti Platform Tiket & Manajemen Pengguna Dasar

### Database (Supabase)
-   [ ] **Skema & Tabel:**
    -   [x] Buat tabel `events` (dengan kolom `id`, `name`, `date`, `location`, `price_tiers` (jsonb), `description`, `image_url`, `organizer`, `category`, `available_tickets`, `created_at`, `updated_at`).
    -   [ ] Buat tabel `users` (profil publik: `id` (FK ke `auth.users.id`), `name`, `email`, `avatar_url`, `roles` (jsonb), `account_status`, `join_date`, `last_login`, `total_purchases`, `tickets_purchased`, `affiliate_code`, `bank_details` (jsonb), `created_at`, `updated_at`).
    -   [ ] Buat tabel `coupons` (`id`, `code`, `discount_type`, `discount_value`, `expiry_date`, `is_active`, `usage_limit`, `times_used`, `min_purchase`, `description`, `created_at`, `updated_at`).
    -   [ ] Buat tabel `bookings` (`id`, `event_id` (FK), `user_id` (FK), `event_name`, `user_name`, `user_email`, `tickets`, `total_price`, `booking_date`, `payment_status`, `coupon_id` (FK), `coupon_code`, `discount_amount`, `selected_tier_name`, `selected_tier_price`, `used_referral_code`, `buyer_referral_code`, `ticket_pdf_url`, `created_at`, `updated_at`).
-   [ ] **Row Level Security (RLS):**
    -   [ ] Terapkan RLS awal untuk tabel `events` (misalnya, publik bisa baca, admin bisa tulis).
    -   [ ] Terapkan RLS untuk tabel `users` (pengguna bisa update profil sendiri, admin bisa kelola).
    -   [ ] Terapkan RLS untuk tabel `coupons` (admin bisa kelola, fungsi booking bisa baca).
    -   [ ] Terapkan RLS untuk tabel `bookings` (pengguna bisa baca booking sendiri, admin bisa baca semua, fungsi booking bisa tulis).
-   [ ] **Fungsi & Trigger Database:**
    -   [x] Implementasikan DB Function `handle_new_user` dan Trigger untuk menyinkronkan `auth.users` ke `public.users`.

### Autentikasi (Supabase Auth)
-   [ ] **Frontend:**
    -   [ ] Buat komponen/halaman untuk Login Pengguna.
    -   [ ] Buat komponen/halaman untuk Registrasi Pengguna.
    -   [ ] Implementasikan logika Logout.
    -   [ ] Lindungi rute yang memerlukan autentikasi (misalnya, dasbor pengguna, admin).
    -   [ ] Tampilkan status login/profil pengguna di header.

### Frontend (Next.js) - Fitur Pengguna
-   [ ] **Halaman Utama (`/`)**:
    -   [ ] Ambil dan tampilkan daftar acara dari tabel `events` Supabase.
-   [ ] **Halaman Detail Acara (`/events/[id]`)**:
    -   [x] Ambil dan tampilkan detail acara spesifik dari tabel `events` Supabase.
-   [ ] **Formulir Pemesanan (`BookingForm.tsx`)**:
    -   [x] Ambil detail kupon dari tabel `coupons` Supabase untuk validasi.
    -   [x] Panggil Supabase Edge Function `create-booking` saat submit.
    -   [ ] Tangani respons (sukses/error) dari Edge Function.
    -   [ ] Dapatkan `user_id` dari sesi Supabase Auth jika pengguna login.
-   [ ] **Halaman Konfirmasi Pemesanan (`/booking/confirmation/[bookingId]`)**:
    -   [x] Tampilkan detail berdasarkan data yang diterima/disimpan dari respons Edge Function `create-booking`.
-   [ ] **Halaman Tiket Saya (`/my-tickets`)**:
    -   [ ] Ambil dan tampilkan daftar tiket (dari tabel `bookings`) milik pengguna yang sedang login.
-   [ ] **Halaman Pengaturan Pengguna (`/dashboard/user/settings`)**:
    -   [ ] Ambil data profil pengguna yang sedang login dari tabel `users` Supabase.
    -   [ ] Izinkan pengguna memperbarui nama, avatar, dan detail bank (jika afiliasi) ke tabel `users` Supabase.

### Backend (Supabase Edge Functions)
-   [x] **`create-booking` Edge Function:**
    -   [x] Terima payload dari frontend.
    -   [x] Validasi ketersediaan tiket dan harga dari tabel `events`.
    -   [x] Validasi kupon dari tabel `coupons`.
    -   [x] Hitung harga akhir.
    -   [x] Simpan pesanan baru ke tabel `bookings`.
    -   [x] Update `times_used` di tabel `coupons`.
    -   [x] Kurangi `available_tickets` di tabel `events`.
    -   [x] Generate `buyer_referral_code` dan simpan ke `bookings`.
    -   [x] Kembalikan respons ke frontend.

### Frontend (Next.js) - Dasbor Admin (Dasar)
-   [ ] **Kelola Acara (`/dashboard/admin/manage-events`)**:
    -   [x] Ambil dan tampilkan daftar acara dari tabel `events` Supabase.
    -   [x] Implementasikan fungsi hapus acara dari tabel `events` Supabase.
-   [ ] **Tambah Acara Baru (`/dashboard/admin/manage-events/new`)**:
    -   [x] Simpan data acara baru ke tabel `events` Supabase.
-   [ ] **Kelola Kupon (`/dashboard/admin/coupons`)**:
    -   [ ] Ambil dan tampilkan daftar kupon dari tabel `coupons` Supabase.
    -   [ ] Implementasikan fungsi hapus dan toggle status aktif kupon di tabel `coupons` Supabase.
-   [ ] **Tambah Kupon Baru (`/dashboard/admin/coupons/new`)**:
    -   [ ] Simpan data kupon baru ke tabel `coupons` Supabase.
-   [ ] **Kelola Pesanan (`/dashboard/admin/orders`)**:
    -   [ ] Ambil dan tampilkan daftar pesanan dari tabel `bookings` Supabase.
-   [ ] **Pengaturan Admin (`/dashboard/admin/settings`)**:
    -   [ ] Simpan/muat pengaturan (Meta Pixel, GA, Info Bank Admin) ke/dari tabel `admin_settings` baru di Supabase (atau solusi penyimpanan konfigurasi lain).

---

## Fase 2: Implementasi Sistem Afiliasi

### Database (Supabase)
-   [ ] Buat tabel `commissions` (`id`, `booking_id` (FK), `affiliate_id` (FK ke `users.id`), `amount`, `status` (`pending`, `paid`, `rejected`), `commission_date`, `created_at`).
-   [ ] Buat tabel `withdrawal_requests` (`id`, `affiliate_id` (FK ke `users.id`), `request_date`, `amount`, `status` (`Pending`, `Approved`, `Rejected`, `Completed`), `processed_date`, `admin_notes`, `bank_snapshot` (jsonb), `created_at`).
-   [ ] Terapkan RLS untuk tabel `commissions` dan `withdrawal_requests`.

### Backend (Supabase Edge Functions/DB Functions)
-   [ ] **Peningkatan `create-booking` Edge Function:**
    -   [ ] Jika `used_referral_code` valid:
        -   Identifikasi `affiliate_id` pemilik kode referral.
        -   Hitung jumlah komisi.
        -   Simpan entri baru ke tabel `commissions` dengan status `pending`.
-   [ ] **`request-withdrawal` Edge Function:**
    -   [ ] Terima `affiliate_id` (dari pengguna terautentikasi) dan `amount`.
    -   [ ] Validasi apakah saldo komisi `pending` afiliasi mencukupi.
    -   [ ] Buat entri baru di `withdrawal_requests` dengan status `Pending`.
    -   [ ] Ambil detail bank afiliasi saat ini dan simpan di `bank_snapshot` pada `withdrawal_requests`.
-   [ ] **`process-withdrawal` Edge Function (Admin):**
    -   [ ] Terima `withdrawal_id` dan `action` (`approve`/`reject`).
    -   [ ] Update status di `withdrawal_requests`.
    -   [ ] Jika `approve`, update status komisi terkait di tabel `commissions` menjadi `paid`.
    -   [ ] (Logika transfer bank aktual terjadi di luar sistem).
-   [ ] **`activate-affiliate` Edge Function (Admin):**
    -   [ ] Terima `user_id`.
    -   [ ] Generate `affiliate_code` unik jika belum ada.
    -   [ ] Update kolom `roles` di tabel `users` untuk menambahkan `'affiliate'`.
    -   [ ] Update kolom `affiliate_code` di tabel `users`.

### Frontend (Next.js) - Dasbor Afiliasi (`/dashboard/affiliate`)
-   [ ] Ambil dan tampilkan data afiliasi yang sedang login (total komisi, saldo tersedia, dll.) dari tabel `users` dan agregasi dari `commissions`.
-   [ ] Implementasikan fungsionalitas pembuat tautan afiliasi.
-   [ ] Tampilkan daftar penjualan yang direferensikan dari tabel `commissions`.
-   [ ] Tampilkan riwayat penarikan dari tabel `withdrawal_requests`.
-   [ ] Buat formulir untuk mengirim permintaan penarikan (memanggil Edge Function `request-withdrawal`).

### Frontend (Next.js) - Dasbor Admin
-   [ ] **Manajemen Afiliasi (`/dashboard/admin/affiliates-management`)**:
    -   [ ] Tampilkan daftar pengguna yang memiliki peran `'affiliate'`.
    -   [ ] Tampilkan daftar permintaan penarikan dari `withdrawal_requests`.
    -   [ ] Implementasikan tombol untuk menyetujui/menolak permintaan (memanggil Edge Function `process-withdrawal`).
    -   [ ] Tombol untuk mengaktifkan/menonaktifkan status afiliasi pengguna (memanggil Edge Function `activate-affiliate` atau fungsi serupa untuk menonaktifkan).
-   [ ] **Kelola Pengguna (`/dashboard/admin/users`)**:
    -   [ ] Perbarui agar bisa menampilkan dan mengelola peran afiliasi.

---

## Fase 3: Peningkatan Dasbor Admin & Integrasi Pembayaran

### Integrasi Gateway Pembayaran
-   [ ] **Frontend:**
    -   [ ] Pilih dan integrasikan SDK/UI Kit dari penyedia gateway pembayaran (misalnya, Midtrans, Xendit) ke dalam alur `BookingForm`.
    -   [ ] Arahkan pengguna ke halaman pembayaran atau tampilkan popup pembayaran.
    -   [ ] Tangani callback sukses/gagal dari gateway pembayaran di sisi klien.
-   [ ] **Backend (Supabase Edge Function):**
    -   [ ] Buat Edge Function baru (misalnya, `payment-webhook`) untuk menerima notifikasi dari gateway pembayaran.
    -   [ ] Verifikasi keaslian webhook.
    -   [ ] Jika pembayaran berhasil:
        -   Update `payment_status` di tabel `bookings` menjadi `paid`.
        -   Picu proses pembuatan e-tiket dan pengiriman email (lihat poin berikutnya).

### Pembuatan E-Tiket & Pengiriman Email
-   [ ] **Backend (Peningkatan `payment-webhook` atau Edge Function baru `generate-send-eticket`):**
    -   [x] **(Dasar PDF sudah ada di `create-booking`, perlu disempurnakan dan dipicu pasca-bayar)**
    -   [ ] Fungsi untuk mengambil detail pesanan.
    -   [x] Fungsi untuk men-generate QR code (dari `booking_id`).
    -   [x] Fungsi untuk men-generate PDF e-tiket yang berisi detail acara, pemesan, dan QR code.
    -   [x] Simpan PDF yang di-generate ke Supabase Storage.
    -   [x] Update kolom `ticket_pdf_url` di tabel `bookings` dengan URL dari Supabase Storage.
    -   [ ] Implementasikan pengiriman email (menggunakan layanan eksternal seperti Resend/SendGrid) dengan lampiran PDF e-tiket atau tautan unduh.

### Frontend (Next.js) - Dasbor Admin (Peningkatan)
-   [ ] **Kelola Acara:** Implementasikan fungsionalitas Edit Acara (form edit & update ke Supabase).
-   [ ] **Kelola Kupon:** Implementasikan fungsionalitas Edit Kupon.
-   [ ] **Kelola Pesanan:**
    -   [ ] Tambahkan filter berdasarkan status pembayaran, acara, dll.
    -   [ ] Tambahkan fungsionalitas pencarian.
    -   [ ] Tampilkan link ke e-tiket jika sudah digenerate.
-   [ ] **Kelola Pengguna:**
    -   [ ] Tambahkan filter berdasarkan peran, status akun.
    -   [ ] Implementasikan fungsionalitas edit detail pengguna (oleh admin).
    -   [ ] Implementasikan manajemen peran yang lebih detail.

### Frontend (Next.js) - Pengguna
-   [ ] **Halaman "Tiket Saya"**:
    -   [ ] Pastikan tombol "Unduh E-Tiket" berfungsi dengan benar, mengarah ke `ticket_pdf_url` dari Supabase.

---

## Fase 4: Pengujian, Deployment, dan Iterasi Berkelanjutan

-   [ ] **Pengujian:**
    -   [ ] Tulis pengujian unit untuk logika kritis di Edge Functions.
    -   [ ] Lakukan pengujian integrasi untuk alur utama (pemesanan dengan kupon, pendaftaran afiliasi, permintaan penarikan, konfirmasi pembayaran -> e-tiket).
    -   [ ] (Opsional) Lakukan pengujian E2E untuk skenario pengguna utama.
-   [ ] **Keamanan:**
    -   [ ] Review semua RLS policy untuk memastikan tidak ada celah keamanan.
    -   [ ] Pastikan semua input divalidasi di sisi server (Edge Functions).
    -   [ ] Pastikan tidak ada API key atau kredensial sensitif yang terekspos di frontend.
-   [ ] **Deployment:**
    -   [ ] Siapkan environment produksi di Supabase.
    -   [ ] Konfigurasikan CI/CD pipeline (misalnya, GitHub Actions) untuk mendeploy perubahan frontend ke Vercel/Netlify dan Supabase Functions ke Supabase.
-   [ ] **Monitoring & Logging:**
    -   [ ] Manfaatkan log Supabase untuk Edge Functions dan database.
    -   [ ] (Opsional) Integrasikan layanan monitoring error eksternal (misalnya Sentry).
-   [ ] **Iterasi:**
    -   Kumpulkan feedback dari pengguna (jika ada pengujian beta).
    -   Rencanakan perbaikan dan fitur tambahan berdasarkan feedback dan prioritas bisnis.
