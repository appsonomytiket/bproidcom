
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
import { createBrowserClient } from '@supabase/ssr'; // Import Supabase client

// async function getUsersData(): Promise<User[]> {
//   // This will be replaced by direct Supabase fetch in useEffect
//   return MOCK_USERS;
// }

export default function UsersPage() {
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch users from public.users table
      // Ensure your RLS allows admins to select from this table.
      // The 'User' type in lib/types.ts uses camelCase, but DB is snake_case.
      // We need to map or adjust the type. For now, select specific columns.
      const { data, error } = await supabase
        .from('users') // public.users table
        .select('id, full_name, email, avatar_url, roles, account_status, created_at, last_login_at, referral_code') // referral_code is affiliateCode
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedUsers: User[] = data?.map((dbUser: any) => ({
        id: dbUser.id,
        name: dbUser.full_name || 'N/A',
        email: dbUser.email,
        avatarUrl: dbUser.avatar_url,
        roles: (dbUser.roles || ['customer']) as UserRole[], // Ensure roles is an array
        accountStatus: dbUser.account_status || 'Tidak Aktif',
        joinDate: dbUser.created_at, // Assuming created_at is joinDate
        lastLogin: dbUser.last_login_at, // Assuming last_login_at is lastLogin
        totalPurchases: 0, // Placeholder, needs to be calculated or joined
        ticketsPurchased: 0, // Placeholder, needs to be calculated or joined
        affiliateCode: dbUser.referral_code,
        // bankDetails: dbUser.bank_details, // If needed
      })) || [];
      setUsers(mappedUsers);

    } catch (error: any) {
      console.error("Error fetching users from Supabase:", error);
      toast({
        title: "Gagal Memuat Pengguna",
        description: error.message || "Terjadi masalah saat mengambil data pengguna.",
        variant: "destructive",
      });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };


  React.useEffect(() => {
    fetchUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleActivateAffiliate = async (userId: string, userName: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('activate-affiliate', {
        body: { user_id_to_activate: userId },
      });

      if (error) throw error;

      toast({
        title: "Sukses",
        description: (data as any)?.message || `${userName} sekarang adalah afiliasi. Kode: ${(data as any)?.referral_code}`,
      });
      fetchUsers(); // Refresh user list
    } catch (error: any) {
      toast({
        title: "Gagal Aktivasi Afiliasi",
        description: error.message || "Terjadi kesalahan.",
        variant: "destructive",
      });
    }
  };

  const handleDeactivateAffiliate = async (userId: string, userName: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('deactivate-affiliate', {
        body: { user_id_to_deactivate: userId },
      });

      if (error) throw error;

      toast({
        title: "Sukses",
        description: (data as any)?.message || `${userName} bukan lagi seorang afiliasi.`,
      });
      fetchUsers(); // Refresh user list
    } catch (error: any) {
      toast({
        title: "Gagal Cabut Status Afiliasi",
        description: error.message || "Terjadi kesalahan.",
        variant: "destructive",
      });
    }
  };

  const handleUserAction = (action: string, userName: string, userId?: string) => {
    if (action === 'Jadikan Afiliasi' && userId) {
      handleActivateAffiliate(userId, userName);
    } else if (action === 'Cabut Status Afiliasi' && userId) {
      handleDeactivateAffiliate(userId, userName);
    } else {
      toast({
        title: `Aksi: ${action}`,
        description: `Aksi "${action}" untuk pengguna ${userName} belum diimplementasikan.`,
      });
    }
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
                        <AvatarImage src={user.avatarUrl || `https://placehold.co/40x40.png?text=${user.name ? user.name.charAt(0) : 'U'}`} alt={user.name} data-ai-hint="profile avatar" />
                        <AvatarFallback>{user.name ? user.name.substring(0, 2).toUpperCase() : 'US'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {user.roles?.map(role => ( // Added optional chaining for roles
                            <Badge key={role} variant={getRoleBadgeVariant(role)} className="text-xs">
                              {getRoleDisplayName(role)}
                              {role === 'affiliate' && user.affiliateCode && ` (${user.affiliateCode})`}
                            </Badge>
                          ))}
                           {(!user.roles || user.roles.length === 0) && <Badge variant="outline" className="text-xs">Customer</Badge>}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(user.accountStatus)}>{user.accountStatus}</Badge>
                  </TableCell>
                  <TableCell>{user.joinDate ? format(parseISO(user.joinDate), "dd MMM yyyy", { locale: idLocale }) : 'N/A'}</TableCell>
                  <TableCell>
                    {user.lastLogin && user.lastLogin !== 'N/A' 
                      ? format(parseISO(user.lastLogin), "dd MMM yyyy, HH:mm", { locale: idLocale }) 
                      : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">Rp {user.totalPurchases?.toLocaleString() || '0'}</TableCell>
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
                        <DropdownMenuItem onClick={() => handleUserAction('Edit Pengguna', user.name, user.id)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit Pengguna
                        </DropdownMenuItem>
                        {!user.roles.includes('admin') && (
                          <DropdownMenuItem onClick={() => handleUserAction('Jadikan Admin', user.name, user.id)}>
                            <ShieldCheck className="mr-2 h-4 w-4" /> Jadikan Admin
                          </DropdownMenuItem>
                        )}
                        {user.roles.includes('affiliate') && (
                          <DropdownMenuItem onClick={() => handleUserAction('Cabut Status Afiliasi', user.name, user.id)}>
                            <UserX className="mr-2 h-4 w-4" /> Cabut Status Afiliasi
                          </DropdownMenuItem>
                        )}
                        {!user.roles.includes('affiliate') && (
                          <DropdownMenuItem onClick={() => handleUserAction('Jadikan Afiliasi', user.name, user.id)}>
                            <UserCheck className="mr-2 h-4 w-4" /> Jadikan Afiliasi
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleUserAction('Tangguhkan Akun', user.name, user.id)}>
                          <UserCog className="mr-2 h-4 w-4" /> Tangguhkan Akun
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => handleUserAction('Hapus Pengguna', user.name, user.id)}>
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
