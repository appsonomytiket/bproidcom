
"use client";

import Link from "next/link";
import { Ticket, Settings, BarChart3, ClipboardList, Bot, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from '@/components/ui/sidebar'; // Import SidebarTrigger
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Tombol trigger sidebar untuk mobile dan desktop (jika diperlukan untuk toggle manual) */}
        <SidebarTrigger className="mr-3 shrink-0" /> 

        <Link href="/" className="flex items-center gap-2 mr-auto"> {/* mr-auto mendorong nav ke kanan */}
          <Ticket className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold text-primary">Bproid</span>
        </Link>
        
        <nav className="hidden items-center gap-4 md:flex">
          <Link
            href="/"
            className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
          >
            Acara
          </Link>
          <Link
            href="/dashboard/affiliate"
            className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
          >
            Dasbor Afiliasi
          </Link>
          {/* Dropdown Admin mungkin bisa dipertimbangkan untuk dihapus jika semua link ada di sidebar */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground">
                Admin Area <Settings className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Tautan Cepat Admin</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/admin" className="flex items-center">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Analitik Utama
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/admin/manage-events" className="flex items-center">
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Kelola Acara
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/admin/ai-description-generator" className="flex items-center">
                  <Bot className="mr-2 h-4 w-4" />
                  Alat Deskripsi AI
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
        <div className="flex items-center gap-4 md:hidden"> {/* Navigasi mobile bisa ditaruh di sini jika diperlukan, atau sidebar cukup */}
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
                 <span className="sr-only">Menu Admin Mobile</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Admin Area</DropdownMenuLabel>
              <DropdownMenuSeparator />
               <DropdownMenuItem asChild><Link href="/" className="flex items-center">Acara</Link></DropdownMenuItem>
               <DropdownMenuItem asChild><Link href="/dashboard/affiliate" className="flex items-center">Dasbor Afiliasi</Link></DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/admin" className="flex items-center">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Analitik Utama
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/admin/manage-events" className="flex items-center">
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Kelola Acara
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/admin/ai-description-generator" className="flex items-center">
                  <Bot className="mr-2 h-4 w-4" />
                  Alat Deskripsi AI
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
