
"use client";

import Link from "next/link";
import { Ticket, LayoutDashboard, Bot, UserCircle, BarChart3, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Ticket className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold text-primary">Bproid</span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/"
            className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
          >
            Events
          </Link>
          <Link
            href="/dashboard/affiliate"
            className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
          >
            Affiliate Dashboard
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground">
                Admin <Settings className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Admin Area</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/admin" className="flex items-center">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Sales Analytics
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/admin/ai-description-generator" className="flex items-center">
                  <Bot className="mr-2 h-4 w-4" />
                  AI Description Tool
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
        <div className="flex items-center gap-4">
           {/* Placeholder for potential user auth button */}
           {/* <Button variant="outline" size="sm">
            <UserCircle className="mr-2 h-4 w-4" />
            Login
          </Button> */}
        </div>
      </div>
    </header>
  );
}
