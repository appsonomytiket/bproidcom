
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Session } from "@supabase/supabase-js";
import { Ticket, Settings, BarChart3, ClipboardList, UserCircle, CreditCard, LogOut, ShieldCheck, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Header() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (_event === 'SIGNED_OUT') {
        router.refresh(); // Ensure server components are re-rendered
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    // router.refresh(); // onAuthStateChange already handles refresh for SIGNED_OUT
  };

  const user = session?.user;
  // Assuming roles are stored in user_metadata.roles as an array e.g. ['admin']
  // Or directly in app_metadata.roles (less common for direct user setting)
  const userRole = user?.user_metadata?.roles?.[0] || user?.app_metadata?.roles?.[0] || null;
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "User";
  const userEmail = user?.email || "No email";
  const userAvatarUrl = user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random`;


  if (loading) {
    // Optional: render a loading state for the header or parts of it
    return (
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <Link href="/" className="flex items-center gap-2 mr-auto">
            <Ticket className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-primary">Bproid</span>
          </Link>
          {/* Placeholder for nav items while loading */}
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="flex items-center gap-2 mr-auto">
          <Ticket className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold text-primary">Bproid</span>
        </Link>
        
        <nav className="hidden items-center gap-1 md:flex">
          <Button variant="link" asChild className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground hover:no-underline">
            <Link href="/">Acara</Link>
          </Button>
          {session && (
            <Button variant="link" asChild className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground hover:no-underline">
              <Link href="/dashboard/affiliate">Dasbor Afiliasi</Link>
            </Button>
          )}
          
          {session && userRole === 'admin' && (
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
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={userAvatarUrl} alt={userName} />
                    <AvatarFallback>{userName.substring(0,1).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {userEmail}
                    </p>
                    {userRole && (
                       <div className="flex items-center pt-1">
                          <ShieldCheck className="mr-1 h-3.5 w-3.5 text-primary" />
                          <p className="text-xs font-medium text-primary capitalize">{userRole}</p>
                      </div>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {userRole === 'admin' && (
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/admin" className="flex items-center">
                      <UserCircle className="mr-2 h-4 w-4" />
                      <span>Dasbor Admin</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
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
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Keluar</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Register</Link>
              </Button>
            </>
          )}
        </nav>

        {/* Mobile Menu */}
        <div className="flex items-center gap-2 md:hidden">
           {session ? (
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                   <Avatar className="h-9 w-9">
                    <AvatarImage src={userAvatarUrl} alt={userName} />
                    <AvatarFallback>{userName.substring(0,1).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="sr-only">Buka menu pengguna</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                 <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {userEmail}
                    </p>
                     {userRole && (
                       <div className="flex items-center pt-1">
                          <ShieldCheck className="mr-1 h-3.5 w-3.5 text-primary" />
                          <p className="text-xs font-medium text-primary capitalize">{userRole}</p>
                      </div>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link href="/" className="flex items-center">Beranda</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/dashboard/affiliate" className="flex items-center">Dasbor Afiliasi</Link></DropdownMenuItem>
                {userRole === 'admin' && (
                  <>
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
                  </>
                )}
                <DropdownMenuSeparator />
                 <DropdownMenuItem asChild>
                  <Link href="/my-tickets" className="flex items-center">
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Tiket Saya</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/user/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Pengaturan Akun</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Keluar</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
           ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <LogIn className="h-5 w-5" />
                  <span className="sr-only">Menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/login">Login</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/register">Register</Link>
                </DropdownMenuItem>
                 <DropdownMenuItem asChild><Link href="/">Acara</Link></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
           )}
        </div>
      </div>
    </header>
  );
}
