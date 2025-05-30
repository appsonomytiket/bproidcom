
// src/app/dashboard/admin/users/page.tsx
"use client";

import * as React from 'react';
import Image from 'next/image';
import { MOCK_USERS } from "@/lib/constants";
import type { User, UserRole } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, UsersRound, Edit, ShieldCheck, UserX, Trash2, UserCog, UserCheck } from "lucide-react";
import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

async function getUsersData(): Promise<User[]> {
  // In a real application, you would fetch this data from your database
  // For now, we use MOCK_USERS directly on the client-side
  return MOCK_USERS;
}

export default function UsersPage() {
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    getUsersData().then(data => {
      setUsers(data);
      setLoading(false);
    });
  }, []);

  const handleUserAction = (action: string, userName: string) => {
    toast({
      title: `Aksi: ${action}`,
      description: `Aksi "${action}" untuk pengguna ${userName} belum diimplementasikan.`,
    });
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'destructive'; // Or any distinct color like primary
      case 'affiliate':
        return 'default'; // Greenish/Primary
      case 'customer':
        return 'secondary';
      default:
        return 'outline';
    }
  };
  
  const getRoleDisplayName = (role: UserRole) => {
    if (role === 'affiliate') return 'Afiliasi';
    if (role === 'admin') return 'Admin';
    if (role === 'customer') return 'Pelanggan';
    return role;
  }

  const getStatusBadgeVariant = (status: User['accountStatus']) => {
    switch (status) {
      case 'Aktif':
        return 'default';
      case 'Ditangguhkan':
        return 'secondary'; // Yellowish/Orange if available, or secondary
      case 'Tidak Aktif':
        return 'destructive';
      default:
        return 'outline';
    }
  };


  if (loading) {
    return (
      <div className="container py-12">
        <p>Memuat data pengguna...</p>
      </div>
    );
  }

  return (
    <div className="container py-12 space-y-8">
      <Card className="shadow-xl">
        <CardHeader className="bg-primary text-primary-foreground p-6 rounded-t-lg">
          <div className="flex items-center gap-3">
            <UsersRound className="h-10 w-10" />
            <div>
              <CardTitle className="text-3xl font-bold">Daftar Pengguna</CardTitle>
              <CardDescription className="text-primary-foreground/80">
                Berikut adalah daftar semua pengguna terdaftar beserta ringkasan aktivitas mereka.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {users.length === 0 ? (
             <div className="text-center py-10 text-muted-foreground">
              <p>Tidak ada pengguna yang ditemukan.</p>
            </div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pengguna</TableHead>
                <TableHead>Status Akun</TableHead>
                <TableHead>Tanggal Bergabung</TableHead>
                <TableHead>Login Terakhir</TableHead>
                <TableHead className="text-right">Total Pembelian</TableHead>
                <TableHead className="text-center">Tiket</TableHead>
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatarUrl || `https://placehold.co/40x40.png?text=${user.name.charAt(0)}`} alt={user.name} data-ai-hint="profile avatar" />
                        <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {user.roles.map(role => (
                            <Badge key={role} variant={getRoleBadgeVariant(role)} className="text-xs">
                              {getRoleDisplayName(role)}
                              {role === 'affiliate' && user.affiliateCode && ` (${user.affiliateCode})`}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(user.accountStatus)}>{user.accountStatus}</Badge>
                  </TableCell>
                  <TableCell>{format(parseISO(user.joinDate), "dd MMM yyyy", { locale: idLocale })}</TableCell>
                  <TableCell>
                    {user.lastLogin && user.lastLogin !== 'N/A' 
                      ? format(parseISO(user.lastLogin), "dd MMM yyyy, HH:mm", { locale: idLocale }) 
                      : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">Rp {user.totalPurchases.toLocaleString()}</TableCell>
                  <TableCell className="text-center">{user.ticketsPurchased}</TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Aksi Pengguna</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Aksi Pengguna</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleUserAction('Edit Pengguna', user.name)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit Pengguna
                        </DropdownMenuItem>
                        {!user.roles.includes('admin') && (
                          <DropdownMenuItem onClick={() => handleUserAction('Jadikan Admin', user.name)}>
                            <ShieldCheck className="mr-2 h-4 w-4" /> Jadikan Admin
                          </DropdownMenuItem>
                        )}
                        {user.roles.includes('affiliate') && (
                          <DropdownMenuItem onClick={() => handleUserAction('Cabut Status Afiliasi', user.name)}>
                            <UserX className="mr-2 h-4 w-4" /> Cabut Status Afiliasi
                          </DropdownMenuItem>
                        )}
                         {!user.roles.includes('affiliate') && (
                          <DropdownMenuItem onClick={() => handleUserAction('Jadikan Afiliasi', user.name)}>
                            <UserCheck className="mr-2 h-4 w-4" /> Jadikan Afiliasi
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleUserAction('Tangguhkan Akun', user.name)}>
                          <UserCog className="mr-2 h-4 w-4" /> Tangguhkan Akun
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => handleUserAction('Hapus Pengguna', user.name)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Hapus Pengguna
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
