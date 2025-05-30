
import type { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { Toaster } from "@/components/ui/toaster";
import { Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { AdminSidebarItems } from './AdminSidebarItems';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <>
      <div className="flex min-h-screen"> {/* Container utama untuk sidebar + konten */}
        <Sidebar
          side="left"
          variant="sidebar"
          collapsible="icon" // Diciutkan menjadi ikon, tooltip saat hover
          className="bg-sidebar text-sidebar-foreground border-r border-sidebar-border" // Terapkan warna tema dan border
        >
          <AdminSidebarItems />
        </Sidebar>

        <SidebarInset> {/* Area konten utama yang menyesuaikan dengan sidebar */}
          <div className="flex flex-1 flex-col"> {/* Flex internal untuk stacking header/main/footer */}
            <Header /> {/* Header sekarang bagian dari area inset */}
            <main className="flex-1 bg-background text-foreground">{children}</main>
            <Footer />
          </div>
        </SidebarInset>
      </div>
      <Toaster />
    </>
  );
}
