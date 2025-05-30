
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { 
  LayoutList, 
  TicketCheck, 
  Share2, 
  BadgePercent, 
  UsersRound, 
  SlidersHorizontal,
  BarChart3,
  Bot,
  Settings // Contoh ikon tambahan jika diperlukan
} from 'lucide-react';
import Image from 'next/image'; // Untuk logo jika ada

// Fungsi bantuan untuk menentukan apakah tautan aktif
const isActive = (pathname: string, href: string, exact: boolean = false) => {
  if (exact) {
    return pathname === href;
  }
  return pathname.startsWith(href);
};

export function AdminSidebarItems() {
  const pathname = usePathname();

  const menuItems = [
    { href: '/dashboard/admin', label: 'Analitik', icon: BarChart3, exact: true },
    { href: '/dashboard/admin/manage-events', label: 'Acara', icon: LayoutList },
    { href: '/dashboard/admin/orders', label: 'Pesanan', icon: TicketCheck }, // Halaman baru
    { href: '/dashboard/admin/affiliates-management', label: 'Afiliasi', icon: Share2 }, // Halaman baru (untuk admin)
    { href: '/dashboard/admin/coupons', label: 'Kupon', icon: BadgePercent }, // Halaman baru
    { href: '/dashboard/admin/users', label: 'Pengguna', icon: UsersRound }, // Halaman baru
    { href: '/dashboard/admin/ai-description-generator', label: 'Generator AI', icon: Bot },
    { href: '/dashboard/admin/settings', label: 'Pengaturan', icon: SlidersHorizontal }, // Halaman baru
  ];

  return (
    <>
      <SidebarHeader className="flex h-16 items-center justify-center p-2">
        {/* Logo atau Judul Admin - hanya terlihat saat sidebar tidak diciutkan (non-icon mode) */}
        {/* Ganti dengan logo Anda jika ada */}
        <Link href="/dashboard/admin" className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
           {/* <Image src="/logo.png" alt="Admin Logo" width={32} height={32} /> */}
           <Settings className="h-7 w-7 text-sidebar-primary" /> {/* Contoh ikon jika tidak ada logo teks */}
          <span className="text-xl font-semibold text-sidebar-foreground">Admin</span>
        </Link>
         {/* Ikon yang selalu terlihat, bahkan saat diciutkan */}
        <Link href="/dashboard/admin" className="hidden items-center gap-2 group-data-[collapsible=icon]:flex">
           <Settings className="h-7 w-7 text-sidebar-primary" />
        </Link>
      </SidebarHeader>
      <Separator className="mb-1 bg-sidebar-border" />
      <SidebarContent className="flex-1 p-2"> {/* flex-1 agar konten mengisi ruang */}
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref legacyBehavior={false}>
                <SidebarMenuButton
                  isActive={isActive(pathname, item.href, item.exact)}
                  tooltip={{ children: item.label, side: 'right', align: 'center', className: "bg-popover text-popover-foreground" }}
                  className="justify-start" // Untuk memulai teks dari kiri saat expanded
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className="truncate group-data-[collapsible=icon]:hidden">{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      {/* <SidebarFooter className="p-2 mt-auto border-t border-sidebar-border">
        <Link href="/logout" passHref legacyBehavior={false}>
            <SidebarMenuButton tooltip={{ children: "Keluar", side: 'right', align: 'center' }} className="justify-start">
                <LogOut className="h-5 w-5 shrink-0" />
                <span className="truncate group-data-[collapsible=icon]:hidden">Keluar</span>
            </SidebarMenuButton>
        </Link>
      </SidebarFooter> */}
    </>
  );
}
