
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
import type { User, UserBankDetails } from "@/lib/types";
import { MOCK_USERS } from "@/lib/constants"; // Assuming MOCK_USERS contains the base data

const LOCAL_STORAGE_USER_SETTINGS_KEY_PREFIX = 'bproid_user_settings_';

// Mock current user ID (replace with actual auth logic later)
// For simplicity, let's use the first user from MOCK_USERS or "Admin Webmaster"
const MOCK_CURRENT_USER_ID = MOCK_USERS.find(u => u.email === "zanuradigital@gmail.com")?.id || MOCK_USERS[0]?.id || "usr_000";

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

  useEffect(() => {
    if (typeof window !== 'undefined' && MOCK_CURRENT_USER_ID) {
      const userSettingsKey = `${LOCAL_STORAGE_USER_SETTINGS_KEY_PREFIX}${MOCK_CURRENT_USER_ID}`;
      const storedUserSettingsString = localStorage.getItem(userSettingsKey);
      let userData: User | undefined;

      if (storedUserSettingsString) {
        try {
          userData = JSON.parse(storedUserSettingsString);
        } catch (e) {
          console.error("Gagal mem-parse pengaturan pengguna dari localStorage:", e);
        }
      }
      
      if (!userData) {
          userData = MOCK_USERS.find(u => u.id === MOCK_CURRENT_USER_ID);
      }
      
      if (userData) {
        setCurrentUser(userData);
        profileForm.reset({ name: userData.name, avatarUrl: userData.avatarUrl || "" });
        // emailForm doesn't need reset for current email, as it's displayed
        if (userData.bankDetails) {
          bankAccountForm.reset(userData.bankDetails);
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [MOCK_CURRENT_USER_ID]);


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

  const handleSave = (data: Partial<User>) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, ...data };
    if (data.bankDetails) { // merge bank details properly
        updatedUser.bankDetails = {...currentUser.bankDetails, ...data.bankDetails};
    }
    
    setCurrentUser(updatedUser); // Update local state for immediate UI feedback
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${LOCAL_STORAGE_USER_SETTINGS_KEY_PREFIX}${MOCK_CURRENT_USER_ID}`, JSON.stringify(updatedUser));
    }
  };

  function onProfileSubmit(values: ProfileFormValues) {
    startProfileTransition(() => {
      handleSave({ name: values.name, avatarUrl: values.avatarUrl });
      toast({ title: "Profil Diperbarui", description: "Informasi profil Anda telah disimpan (secara lokal)." });
    });
  }

  function onEmailSubmit(values: EmailFormValues) {
    startEmailTransition(() => {
      // In a real app, this would trigger a verification process
      handleSave({ email: values.newEmail });
      toast({ title: "Permintaan Perubahan Email Terkirim", description: `Email Anda akan diubah ke ${values.newEmail} setelah verifikasi (simulasi).` });
      emailForm.reset();
    });
  }

  function onPasswordSubmit(values: PasswordFormValues) {
    startPasswordTransition(() => {
      // In a real app, validate currentPassword against backend
      console.log("Kata sandi baru (mock):", values.newPassword);
      toast({ title: "Kata Sandi Diperbarui", description: "Kata sandi Anda telah berhasil diubah (simulasi)." });
      passwordForm.reset();
    });
  }
  
  function onBankSubmit(values: BankAccountFormValues) {
    startBankTransition(() => {
      handleSave({ bankDetails: values });
      toast({ title: "Informasi Rekening Disimpan", description: "Detail rekening bank Anda telah disimpan (secara lokal)." });
    });
  }

  if (!currentUser) {
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
              <AvatarImage src={profileForm.watch("avatarUrl") || currentUser.avatarUrl || `https://placehold.co/80x80.png?text=${currentUser.name.charAt(0)}`} alt={currentUser.name} data-ai-hint="user avatar"/>
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
