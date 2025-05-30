
"use client";

import Link from "next/link";
import { Ticket, Settings, BarChart3, ClipboardList, Bot, PanelLeft, UserCircle, CreditCard, LogOut, ShieldCheck } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Mock user data for display purposes
const mockUser = {
  name: "Admin Webmaster",
  email: "zanuradigital@gmail.com",
  avatarUrl: "https://placehold.co/40x40.png", // Placeholder avatar
  role: "Admin",
};

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
        
        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          <Button variant="link" asChild className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground hover:no-underline">
            <Link href="/">Acara</Link>
          </Button>
          <Button variant="link" asChild className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground hover:no-underline">
            <Link href="/dashboard/affiliate">Dasbor Afiliasi</Link>
          </Button>
          
          {/* Admin Area Dropdown - Consider removing if sidebar is primary admin nav */}
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

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={mockUser.avatarUrl} alt={mockUser.name} data-ai-hint="profile avatar" />
                  <AvatarFallback>{mockUser.name.substring(0,1).toUpperCase()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{mockUser.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {mockUser.email}
                  </p>
                  {mockUser.role && (
                     <div className="flex items-center pt-1">
                        <ShieldCheck className="mr-1 h-3.5 w-3.5 text-primary" />
                        <p className="text-xs font-medium text-primary">{mockUser.role}</p>
                    </div>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/admin" className="flex items-center">
                  <UserCircle className="mr-2 h-4 w-4" />
                  <span>Dasbor Admin</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                {/* Assuming this link is for user's purchased tickets, adjust if necessary */}
                <Link href="/my-tickets" className="flex items-center">
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Tiket Saya</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/user/settings" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Pengaturan</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                {/* Adjust logout functionality as needed */}
                <button onClick={() => alert("Fungsi Keluar belum diimplementasikan")} className="w-full flex items-center">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Keluar</span>
                </button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Mobile Navigation Trigger (Hamburger for Admin/User menu) */}
        <div className="flex items-center gap-2 md:hidden">
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                 <Avatar className="h-9 w-9">
                  <AvatarImage src={mockUser.avatarUrl} alt={mockUser.name} data-ai-hint="profile avatar mobile" />
                  <AvatarFallback>{mockUser.name.substring(0,1).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="sr-only">Buka menu pengguna</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
               <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{mockUser.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {mockUser.email}
                  </p>
                   {mockUser.role && (
                     <div className="flex items-center pt-1">
                        <ShieldCheck className="mr-1 h-3.5 w-3.5 text-primary" />
                        <p className="text-xs font-medium text-primary">{mockUser.role}</p>
                    </div>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild><Link href="/" className="flex items-center">Beranda</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/dashboard/affiliate" className="flex items-center">Dasbor Afiliasi</Link></DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Area Admin</DropdownMenuLabel>
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
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/user/settings" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Pengaturan Akun</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <button onClick={() => alert("Fungsi Keluar belum diimplementasikan")} className="w-full flex items-center">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Keluar</span>
                </button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
