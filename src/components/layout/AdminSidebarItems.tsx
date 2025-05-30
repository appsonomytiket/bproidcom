
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter, // Ditambahkan
  useSidebar,    // Ditambahkan
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button'; // Ditambahkan
import { 
  LayoutList, 
  TicketCheck, 
  Share2, 
  BadgePercent, 
  UsersRound, 
  SlidersHorizontal,
  BarChart3,
  Bot,
  Settings,
  PanelLeftOpen,  // Ditambahkan
  PanelLeftClose, // Ditambahkan
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
  const { toggleSidebar, open } = useSidebar(); // Get sidebar state and toggle function

  const menuItems = [
    { href: '/dashboard/admin', label: 'Analitik', icon: BarChart3, exact: true },
    { href: '/dashboard/admin/manage-events', label: 'Acara', icon: LayoutList },
    { href: '/dashboard/admin/orders', label: 'Pesanan', icon: TicketCheck },
    { href: '/dashboard/admin/affiliates-management', label: 'Afiliasi', icon: Share2 },
    { href: '/dashboard/admin/coupons', label: 'Kupon', icon: BadgePercent },
    { href: '/dashboard/admin/users', label: 'Pengguna', icon: UsersRound },
    { href: '/dashboard/admin/ai-description-generator', label: 'Generator AI', icon: Bot },
    { href: '/dashboard/admin/settings', label: 'Pengaturan', icon: SlidersHorizontal },
  ];

  return (
    <>
      <SidebarHeader className="flex h-16 items-center justify-center p-2">
        <Link href="/dashboard/admin" className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
           <Settings className="h-7 w-7 text-sidebar-primary" />
          <span className="text-xl font-semibold text-sidebar-foreground">Admin</span>
        </Link>
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
                  className="justify-start"
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className="truncate group-data-[collapsible=icon]:hidden">{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2 mt-auto border-t border-sidebar-border">
        <Button
          variant="ghost"
          onClick={toggleSidebar}
          className="flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 group-data-[collapsible=icon]:justify-center [&>svg]:size-5 [&>svg]:shrink-0"
          title={open ? "Cuitkan Sidebar" : "Luaskan Sidebar"}
        >
          {open ? <PanelLeftClose /> : <PanelLeftOpen />}
          <span className="truncate group-data-[collapsible=icon]:hidden">
            {open ? "Cuitkan" : "Luaskan"}
          </span>
        </Button>
      </SidebarFooter>
    </>
  );
}
