
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserCircle, Mail, KeyRound, Banknote, Save, Loader2, Building } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useTransition } from "react";
import { supabase } from "@/lib/supabaseClient"; // Import Supabase client
import type { User as AuthUser } from "@supabase/supabase-js"; // For Supabase auth user
import type { User, UserBankDetails } from "@/lib/types"; // For public.users profile type

// const LOCAL_STORAGE_USER_SETTINGS_KEY_PREFIX = 'bproid_user_settings_'; // No longer using localStorage for primary data

const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Nama minimal 2 karakter." }),
  avatarUrl: z.string().url({ message: "URL Avatar tidak valid." }).optional().or(z.literal('')),
});
type ProfileFormValues = z.infer<typeof profileFormSchema>;

const emailFormSchema = z.object({
  newEmail: z.string().email({ message: "Alamat email baru tidak valid." }),
  confirmNewEmail: z.string().email({ message: "Konfirmasi alamat email baru tidak valid." }),
}).refine(data => data.newEmail === data.confirmNewEmail, {
  message: "Email baru dan konfirmasi email tidak cocok.",
  path: ["confirmNewEmail"],
});
type EmailFormValues = z.infer<typeof emailFormSchema>;

const passwordFormSchema = z.object({
  currentPassword: z.string().min(6, { message: "Kata sandi saat ini minimal 6 karakter." }), // Simplified, no real check
  newPassword: z.string().min(6, { message: "Kata sandi baru minimal 6 karakter." }),
  confirmNewPassword: z.string().min(6, { message: "Konfirmasi kata sandi baru minimal 6 karakter." }),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: "Kata sandi baru dan konfirmasi kata sandi tidak cocok.",
  path: ["confirmNewPassword"],
});
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

const bankAccountFormSchema = z.object({
  bankName: z.string().min(2, { message: "Nama bank minimal 2 karakter." }),
  accountNumber: z.string().min(5, { message: "Nomor rekening minimal 5 digit." }).regex(/^\d+$/, "Nomor rekening hanya boleh angka."),
  accountHolderName: z.string().min(2, { message: "Nama pemilik rekening minimal 2 karakter." }),
});
type BankAccountFormValues = z.infer<typeof bankAccountFormSchema>;


export default function UserSettingsPage() {
  const { toast } = useToast();
  const [isProfilePending, startProfileTransition] = useTransition();
  const [isEmailPending, startEmailTransition] = useTransition();
  const [isPasswordPending, startPasswordTransition] = useTransition();
  const [isBankPending, startBankTransition] = useTransition();
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      setLoadingData(true);
      const { data: { user: supabaseAuthUser }, error: authError } = await supabase.auth.getUser();

      if (authError || !supabaseAuthUser) {
        console.error("Error fetching auth user or no user logged in:", authError);
        toast({ title: "Autentikasi Gagal", description: "Silakan login kembali.", variant: "destructive" });
        // router.push('/login'); // Middleware should handle this
        setLoadingData(false);
        return;
      }
      setAuthUser(supabaseAuthUser);

      // Fetch profile from public.users table
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseAuthUser.id)
        .single();

      if (profileError) {
        console.error("Error fetching user profile:", profileError);
        // If profile doesn't exist yet (e.g., handle_new_user trigger might be async or failed)
        // We can use auth user's email and provide default values.
        const profileDataFromAuth: User = {
          id: supabaseAuthUser.id,
          email: supabaseAuthUser.email || "",
          name: supabaseAuthUser.user_metadata?.full_name || supabaseAuthUser.email?.split('@')[0] || "Pengguna Baru",
          avatarUrl: supabaseAuthUser.user_metadata?.avatar_url || "",
          roles: supabaseAuthUser.user_metadata?.roles || ['customer'], // Default role
          accountStatus: 'Aktif', // Default status
          joinDate: supabaseAuthUser.created_at || new Date().toISOString(),
          totalPurchases: 0,
          ticketsPurchased: 0,
          // bankDetails will be undefined initially
        };
        setCurrentUser(profileDataFromAuth);
        profileForm.reset({ name: profileDataFromAuth.name, avatarUrl: profileDataFromAuth.avatarUrl || "" });
        // bankAccountForm will be empty
      } else if (userProfile) {
        setCurrentUser(userProfile as User);
        profileForm.reset({ name: userProfile.name, avatarUrl: userProfile.avatar_url || "" });
        if (userProfile.bank_details) {
          bankAccountForm.reset(userProfile.bank_details as UserBankDetails);
        }
      }
      setLoadingData(false);
    };

    fetchUserData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { name: "", avatarUrl: "" },
  });

  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: { newEmail: "", confirmNewEmail: "" },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmNewPassword: "" },
  });
  
  const bankAccountForm = useForm<BankAccountFormValues>({
    resolver: zodResolver(bankAccountFormSchema),
    defaultValues: { bankName: "", accountNumber: "", accountHolderName: "" },
  });

  // Removed handleSave as updates go directly to Supabase

  async function onProfileSubmit(values: ProfileFormValues) {
    if (!authUser) return;
    startProfileTransition(async () => {
      const { data, error } = await supabase
        .from('users')
        .update({ 
          name: values.name, 
          avatar_url: values.avatarUrl || null // Send null if empty to clear it
        })
        .eq('id', authUser.id)
        .select()
        .single();

      if (error) {
        toast({ title: "Update Profil Gagal", description: error.message, variant: "destructive" });
      } else if (data) {
        setCurrentUser(data as User); // Update local state with returned data
        toast({ title: "Profil Diperbarui", description: "Informasi profil Anda telah disimpan." });
      }
    });
  }

  async function onEmailSubmit(values: EmailFormValues) {
    if (!authUser) return;
    startEmailTransition(async () => {
      // Supabase Auth email change requires user to confirm via email.
      // updateUser can also update user_metadata if needed.
      const { error } = await supabase.auth.updateUser({ email: values.newEmail });

      if (error) {
        toast({ title: "Perubahan Email Gagal", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Konfirmasi Email Terkirim", description: `Silakan cek email Anda (${values.newEmail}) untuk mengkonfirmasi perubahan.` });
        emailForm.reset();
      }
    });
  }

  async function onPasswordSubmit(values: PasswordFormValues) {
    if (!authUser) return;
    startPasswordTransition(async () => {
      // Supabase Auth password change.
      // In a real app, you might want to verify currentPassword first via a custom function
      // if your RLS doesn't allow users to read their own auth.users table directly.
      // For simplicity, we're directly trying to update.
      // Note: supabase.auth.updateUser({ password }) only works if user is logged in.
      const { error } = await supabase.auth.updateUser({ password: values.newPassword });
      
      if (error) {
        // Common error: "Password should be at least 6 characters."
        // Or if current password verification is needed and not implemented server-side: "Invalid current password"
        toast({ title: "Perubahan Kata Sandi Gagal", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Kata Sandi Diperbarui", description: "Kata sandi Anda telah berhasil diubah." });
        passwordForm.reset();
      }
    });
  }
  
  async function onBankSubmit(values: BankAccountFormValues) {
    if (!authUser) return;
    startBankTransition(async () => {
      const { data, error } = await supabase
        .from('users')
        .update({ bank_details: values })
        .eq('id', authUser.id)
        .select()
        .single();
      
      if (error) {
        toast({ title: "Update Rekening Bank Gagal", description: error.message, variant: "destructive" });
      } else if (data) {
        setCurrentUser(data as User); // Update local state
        toast({ title: "Informasi Rekening Disimpan", description: "Detail rekening bank Anda telah disimpan." });
      }
    });
  }

  if (loadingData || !currentUser) { // Check loadingData state
    return (
      <div className="container flex min-h-[calc(100vh-10rem)] items-center justify-center py-12">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" /> Memuat data pengguna...
      </div>
    );
  }
  
  const isAffiliate = currentUser.roles.includes('affiliate');

  return (
    <div className="container py-12 space-y-8">
      <Card className="mx-auto max-w-3xl shadow-xl">
        <CardHeader className="bg-primary text-primary-foreground p-6 rounded-t-lg">
          <div className="flex items-center gap-3">
            <UserCircle className="h-10 w-10" />
            <div>
              <CardTitle className="text-3xl font-bold">Pengaturan Akun</CardTitle>
              <CardDescription className="text-primary-foreground/80">
                Kelola informasi profil dan preferensi akun Anda.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Profile Settings */}
      <Card className="mx-auto max-w-3xl shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-xl"><UserCircle className="mr-2 h-6 w-6 text-accent" />Informasi Profil</CardTitle>
          <CardDescription>Perbarui nama dan foto profil Anda.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4 mb-6">
            <Avatar className="h-20 w-20">
              {/* Use currentUser.avatarUrl directly for display, form field is for input */}
              <AvatarImage src={currentUser.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=random`} alt={currentUser.name} data-ai-hint="user avatar"/>
              <AvatarFallback>{currentUser.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="text-sm text-muted-foreground">Ganti foto profil Anda dengan memasukkan URL gambar baru di bawah ini.</div>
          </div>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
              <FormField
                control={profileForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Lengkap</FormLabel>
                    <FormControl>
                      <Input placeholder="Nama lengkap Anda" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="avatarUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL Avatar (Opsional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/avatar.png" {...field} />
                    </FormControl>
                    <FormDescription>URL ke gambar profil Anda.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isProfilePending} className="bg-primary hover:bg-primary/90">
                {isProfilePending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Simpan Perubahan Profil
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Email Settings */}
      <Card className="mx-auto max-w-3xl shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-xl"><Mail className="mr-2 h-6 w-6 text-accent" />Ubah Alamat Email</CardTitle>
          <CardDescription>Email Anda saat ini: <strong>{currentUser.email}</strong></CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...emailForm}>
            <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-6">
              <FormField
                control={emailForm.control}
                name="newEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Baru</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Masukkan email baru" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={emailForm.control}
                name="confirmNewEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Konfirmasi Email Baru</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Konfirmasi email baru Anda" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isEmailPending} className="bg-primary hover:bg-primary/90">
                {isEmailPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Ubah Email
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Password Settings */}
      <Card className="mx-auto max-w-3xl shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-xl"><KeyRound className="mr-2 h-6 w-6 text-accent" />Ubah Kata Sandi</CardTitle>
          <CardDescription>Perbarui kata sandi akun Anda secara berkala untuk keamanan.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kata Sandi Saat Ini</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Masukkan kata sandi saat ini" {...field} />
                    </FormControl>
                    <FormDescription>Ini hanya simulasi, tidak ada validasi kata sandi saat ini.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kata Sandi Baru</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Masukkan kata sandi baru" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="confirmNewPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Konfirmasi Kata Sandi Baru</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Konfirmasi kata sandi baru" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isPasswordPending} className="bg-primary hover:bg-primary/90">
                {isPasswordPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Ubah Kata Sandi
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {/* Bank Account Settings - Conditional for Affiliates */}
      {isAffiliate && (
        <Card className="mx-auto max-w-3xl shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-xl"><Banknote className="mr-2 h-6 w-6 text-accent" />Informasi Rekening Bank (Afiliasi)</CardTitle>
            <CardDescription>Masukkan detail rekening bank Anda untuk menerima pembayaran komisi afiliasi.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Form {...bankAccountForm}>
              <form onSubmit={bankAccountForm.handleSubmit(onBankSubmit)} className="space-y-6">
                <FormField
                  control={bankAccountForm.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center"><Building className="mr-2 h-4 w-4 text-primary/70"/>Nama Bank</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Bank Central Asia (BCA)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={bankAccountForm.control}
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center"><Banknote className="mr-2 h-4 w-4 text-primary/70"/>Nomor Rekening</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: 1234567890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={bankAccountForm.control}
                  name="accountHolderName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center"><UserCircle className="mr-2 h-4 w-4 text-primary/70"/>Nama Pemilik Rekening</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isBankPending} className="bg-primary hover:bg-primary/90">
                  {isBankPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Simpan Informasi Rekening
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
