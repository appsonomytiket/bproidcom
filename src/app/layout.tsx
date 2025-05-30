
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';
import { SidebarProvider } from '@/components/ui/sidebar'; // Ditambahkan SidebarProvider

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Bproid.com - Platform Tiket Acara Anda',
  description: 'Temukan dan pesan tiket untuk acara-acara luar biasa dengan Bproid.com.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SidebarProvider defaultOpen={true}> {/* Memastikan sidebar dimulai terbuka */}
          <AppShell>{children}</AppShell>
        </SidebarProvider>
      </body>
    </html>
  );
}
