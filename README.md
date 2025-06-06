
# Bproid.com - Platform Tiket Acara & Afiliasi

Selamat datang di Bproid.com! Aplikasi web ini dirancang untuk menjadi platform komprehensif untuk penemuan acara, pemesanan tiket, dan sistem afiliasi yang memberdayakan pengguna untuk mendapatkan komisi.

## Fitur Inti

-   **Daftar Acara**: Pengguna dapat menjelajahi berbagai acara, melihat detail lengkap, dan menemukan acara yang mereka minati.
-   **Sistem Pemesanan Manual**: Proses pemesanan tiket yang mudah dengan opsi pembayaran manual (instruksi transfer bank & QRIS).
-   **Pembuatan Kode Referral Otomatis**: Semua pengguna terdaftar secara otomatis mendapatkan kode referral unik, mengubah mereka menjadi afiliasi potensial. Pembeli juga mendapatkan kode referral setelah transaksi.
-   **Perhitungan Komisi**: Sistem untuk melacak komisi yang diperoleh melalui referral yang berhasil (akan diimplementasikan di backend).
-   **Dasbor Afiliasi**: Afiliasi dapat membuat tautan pelacakan, melihat penjualan referral, penghasilan, dan meminta penarikan.
-   **Dasbor Admin Lengkap**: Admin dapat mengelola acara, pesanan, kupon, pengguna, afiliasi, dan melihat analitik penjualan/komisi.
-   **Manajemen Kupon**: Admin dapat membuat dan mengelola kupon diskon (persentase atau jumlah tetap).

## Tumpukan Teknologi

-   **Frontend**:
    -   Next.js (App Router)
    -   React
    -   TypeScript
    -   ShadCN UI Components
    -   Tailwind CSS
-   **Backend**:
    -   Supabase (PostgreSQL Database, Auth, Storage, Edge Functions)
-   **Styling**:
    -   Tailwind CSS
    -   CSS Variables (untuk tema warna utama)

## Memulai

1.  **Clone repositori** (jika berlaku).
2.  **Instal dependensi**:
    ```bash
    npm install
    # atau
    yarn install
    ```
3.  **Konfigurasi Environment Variables**:
    Buat file `.env` di root proyek dan isi dengan kredensial Supabase Anda:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    # SUPABASE_SERVICE_ROLE_KEY (Untuk Edge Functions, diatur di environment Supabase)
    ```
    Ganti placeholder dengan nilai aktual dari proyek Supabase Anda.
4.  **Jalankan server pengembangan**:
    ```bash
    npm run dev
    # atau
    yarn dev
    ```
    Aplikasi akan tersedia di `http://localhost:9002` (atau port yang dikonfigurasi).

5.  **Supabase Setup**:
    *   Pastikan Anda telah membuat proyek di Supabase.
    *   Buat tabel database yang diperlukan (lihat `TASK.md` atau panduan skema yang diberikan sebelumnya).
    *   Konfigurasikan Row Level Security (RLS) untuk tabel Anda.
    *   Deploy Supabase Edge Functions yang diperlukan (misalnya, `create-booking`).
    *   Buat bucket di Supabase Storage (misalnya, `bproid-tickets`) untuk menyimpan PDF tiket.

## Struktur Direktori Utama

```
/
├── supabase/                # Konfigurasi dan fungsi Supabase
│   ├── functions/
│   │   ├── _shared/
│   │   └── create-booking/  # Contoh Edge Function
│   └── config.toml
├── public/                  # Aset statis
├── src/
│   ├── app/                 # Rute Aplikasi Next.js
│   │   ├── (area_pengguna)/ # Grup rute
│   │   └── ...
│   ├── components/          # Komponen React UI
│   │   ├── booking/
│   │   ├── dashboard/
│   │   ├── events/
│   │   ├── layout/
│   │   └── ui/              # Komponen ShadCN
│   ├── hooks/               # Custom React Hooks
│   ├── lib/                 # Utilitas, konstanta, tipe
│   └── ...
├── .env                     # Variabel lingkungan (JANGAN di-commit jika berisi rahasia)
├── next.config.ts           # Konfigurasi Next.js
├── package.json
└── tsconfig.json
```

## Kontribusi

Panduan kontribusi akan ditambahkan di masa mendatang.
