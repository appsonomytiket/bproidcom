
import type { Event, Booking, Affiliate, AdminSaleData, AdminCommissionData, AdminWithdrawalRequest, Coupon, User } from './types';
import { addMonths, formatISO, subDays } from 'date-fns';

// export const LOCAL_STORAGE_EVENTS_KEY = 'bproid_managed_events'; // No longer primary for events
export const LOCAL_STORAGE_COUPONS_KEY = 'bproid_managed_coupons';
export const LOCAL_STORAGE_USER_SETTINGS_KEY_PREFIX = 'bproid_user_settings_';
export const LOCAL_STORAGE_ANALYTICS_KEY = 'bproid_admin_analytics_settings';
export const LOCAL_STORAGE_PAYMENT_KEY = 'bproid_admin_payment_settings';
export const LOCAL_STORAGE_MIDTRANS_KEY = 'bproid_admin_midtrans_settings';


export const MOCK_EVENTS: Event[] = [
  {
    id: '1',
    name: 'Konser Musik Merdeka',
    date: '2024-08-17T19:00:00Z',
    location: 'Lapangan Banteng, Jakarta',
    priceTiers: [
      { name: 'Festival', price: 150000 },
      { name: 'VIP', price: 300000 },
    ],
    description: 'Rayakan kemerdekaan dengan penampilan musisi ternama tanah air. Dapatkan pengalaman tak terlupakan!',
    imageUrl: 'https://placehold.co/600x400.png',
    organizer: 'Musikindo Jaya',
    category: 'Musik',
    availableTickets: 500,
  },
  {
    id: '2',
    name: 'Workshop Digital Marketing 2024',
    date: '2024-09-05T09:00:00Z',
    location: 'Hotel Indonesia Kempinski, Jakarta',
    priceTiers: [
      { name: 'Early Bird', price: 600000 },
      { name: 'Regular', price: 750000 },
    ],
    description: 'Tingkatkan skill digital marketing Anda bersama para ahli. Materi lengkap dan praktis untuk pemula hingga advance.',
    imageUrl: 'https://placehold.co/600x400.png',
    organizer: 'DigiLearn ID',
    category: 'Workshop',
    availableTickets: 100,
  },
  {
    id: '3',
    name: 'Pameran Seni Kontemporer "Ruang Kita"',
    date: '2024-09-15T10:00:00Z',
    location: 'Galeri Nasional Indonesia, Jakarta',
    priceTiers: [
      { name: 'Umum', price: 50000 },
    ],
    description: 'Jelajahi karya-karya seniman muda berbakat Indonesia dalam pameran seni kontemporer yang menginspirasi.',
    imageUrl: 'https://placehold.co/600x400.png',
    organizer: 'Komunitas Seni Rupa',
    category: 'Pameran',
    availableTickets: 1000,
  },
   {
    id: '4',
    name: 'Bazar Kuliner Nusantara',
    date: '2024-10-01T11:00:00Z',
    location: 'Parkir Timur Senayan, Jakarta',
    priceTiers: [
      { name: 'Tiket Masuk', price: 25000 },
    ],
    description: 'Nikmati aneka hidangan khas dari berbagai penjuru Nusantara. Acara keluarga yang seru dan lezat!',
    imageUrl: 'https://placehold.co/600x400.png',
    organizer: 'Festival Jajanan Enak',
    category: 'Kuliner',
    availableTickets: 2000,
  },
];

export const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'BK001',
    eventId: '1',
    eventName: 'Konser Musik Merdeka',
    userName: 'Andi Pratama',
    userEmail: 'andi@example.com',
    tickets: 2,
    selectedTierName: 'Festival',
    selectedTierPrice: 150000,
    totalPrice: 300000,
    bookingDate: '2024-07-20T10:00:00Z',
    paymentStatus: 'pending',
    checked_in: false,
    // couponCode: undefined, // Example: No coupon used
    // discountAmount: 0,
  },
  {
    id: 'BK002',
    eventId: '2',
    eventName: 'Workshop Digital Marketing 2024',
    userName: 'Budi Santoso',
    userEmail: 'budi@example.com',
    tickets: 1,
    selectedTierName: 'Regular',
    selectedTierPrice: 750000,
    totalPrice: 700000, // Price after potential discount
    bookingDate: '2024-07-22T14:30:00Z',
    paymentStatus: 'paid',
    couponCode: 'DISKON50K', 
    discountAmount: 50000,
    checked_in: false,
  },
];

export const MOCK_AFFILIATE_DATA: Affiliate = {
  id: 'AFF001',
  name: 'Citra Lestari',
  email: 'citra.lestari@example.com',
  referralCode: 'CITRA789REF',
  totalEarnings: 1250000,
  withdrawalHistory: [
    { date: '2024-06-15T10:00:00Z', amount: 500000, status: 'Selesai' }, 
    { date: '2024-07-10T14:00:00Z', amount: 750000, status: 'Diproses' }, 
  ],
  referredSales: [
    { bookingId: 'BK003', eventName: 'Konser Musik Merdeka', commission: 75000, date: '2024-07-25T10:00:00Z' },
    { bookingId: 'BK004', eventName: 'Workshop Digital Marketing', commission: 150000, date: '2024-07-28T10:00:00Z' },
  ],
};

export const MOCK_ADMIN_SALES_DATA: AdminSaleData[] = [
  { month: 'Jan', sales: 4000 },
  { month: 'Feb', sales: 3000 },
  { month: 'Mar', sales: 5000 },
  { month: 'Apr', sales: 4500 },
  { month: 'Mei', sales: 6000 },
  { month: 'Jun', sales: 5500 },
];

export const MOCK_ADMIN_COMMISSION_DATA: AdminCommissionData[] = [
  { month: 'Jan', commissions: 400 },
  { month: 'Feb', commissions: 300 },
  { month: 'Mar', commissions: 500 },
  { month: 'Apr', commissions: 450 },
  { month: 'Mei', commissions: 600 },
  { month: 'Jun', commissions: 550 },
];

export const MOCK_RECENT_BOOKINGS_ADMIN: Booking[] = [
  // ...MOCK_BOOKINGS, // Spread existing bookings
  {
    id: 'BK001',
    eventId: '1',
    eventName: 'Konser Musik Merdeka',
    userName: 'Andi Pratama',
    userEmail: 'andi@example.com',
    tickets: 2,
    selectedTierName: 'Festival',
    selectedTierPrice: 150000,
    totalPrice: 300000,
    bookingDate: '2024-07-20T10:00:00Z',
    paymentStatus: 'pending',
    checked_in: false,
  },
  {
    id: 'BK002',
    eventId: '2',
    eventName: 'Workshop Digital Marketing 2024',
    userName: 'Budi Santoso',
    userEmail: 'budi@example.com',
    tickets: 1,
    selectedTierName: 'Regular',
    selectedTierPrice: 750000,
    totalPrice: 700000, // Price after potential discount
    bookingDate: '2024-07-22T14:30:00Z',
    paymentStatus: 'paid',
    couponCode: 'DISKON50K', 
    discountAmount: 50000,
    checked_in: true,
    checked_in_at: '2024-09-05T08:30:00Z',
  },
  {
    id: 'BK003',
    eventId: '1',
    eventName: 'Konser Musik Merdeka',
    userName: 'Dewi Anggraini',
    userEmail: 'dewi@example.com',
    tickets: 1,
    selectedTierName: 'VIP',
    selectedTierPrice: 300000,
    totalPrice: 300000,
    bookingDate: '2024-07-28T11:00:00Z',
    paymentStatus: 'paid',
    checked_in: false,
    ticket_pdf_url: "https://example.com/dummy-ticket.pdf"
  },
  {
    id: 'BK004',
    eventId: '3',
    eventName: 'Pameran Seni Kontemporer "Ruang Kita"',
    userName: 'Eko Wijaya',
    userEmail: 'eko@example.com',
    tickets: 3,
    selectedTierName: 'Umum',
    selectedTierPrice: 50000,
    totalPrice: 150000,
    bookingDate: '2024-07-29T16:15:00Z',
    paymentStatus: 'pending',
    checked_in: false,
  },
];

export const MOCK_TOP_AFFILIATES_ADMIN: Pick<Affiliate, 'id' | 'name' | 'referralCode' | 'totalEarnings' | 'email'>[] = [
  { id: 'AFF001', name: 'Citra Lestari', email: 'citra.lestari@example.com', referralCode: 'CITRA789REF', totalEarnings: 1250000 },
  { id: 'AFF002', name: 'Rian Hidayat', email: 'rian.hidayat@example.com', referralCode: 'RIANXYZREF', totalEarnings: 980000 },
  { id: 'AFF003', name: 'Siti Aminah', email: 'siti.aminah@example.com', referralCode: 'SITI123REF', totalEarnings: 750000 },
];

export const MOCK_ADMIN_WITHDRAWAL_REQUESTS: AdminWithdrawalRequest[] = [
  { id: 'WR001', affiliateId: 'AFF001', affiliateName: 'Citra Lestari', date: '2024-07-20T10:00:00Z', amount: 750000, status: 'Pending' },
  { id: 'WR002', affiliateId: 'AFF002', affiliateName: 'Rian Hidayat', date: '2024-07-22T14:30:00Z', amount: 500000, status: 'Approved' },
  { id: 'WR003', affiliateId: 'AFF001', affiliateName: 'Citra Lestari', date: '2024-07-10T09:15:00Z', amount: 200000, status: 'Completed' },
  { id: 'WR004', affiliateId: 'AFF003', affiliateName: 'Siti Aminah', date: '2024-07-25T11:00:00Z', amount: 300000, status: 'Rejected' },
];

export const MOCK_COUPONS: Coupon[] = [
  {
    id: 'CPN001',
    code: 'HEMAT20',
    discountType: 'percentage',
    discountValue: 20,
    expiryDate: formatISO(addMonths(new Date(), 1)),
    isActive: true,
    timesUsed: 5,
    usageLimit: 100,
    minPurchase: 100000,
    description: 'Diskon 20% untuk semua acara, min. pembelian Rp100.000',
  },
  {
    id: 'CPN002',
    code: 'DISKON50K',
    discountType: 'fixed',
    discountValue: 50000,
    expiryDate: formatISO(addMonths(new Date(), 2)),
    isActive: true,
    timesUsed: 12,
    minPurchase: 200000,
    description: 'Potongan langsung Rp50.000, min. pembelian Rp200.000',
  },
  {
    id: 'CPN003',
    code: 'LAUNCHNEW',
    discountType: 'percentage',
    discountValue: 15,
    expiryDate: formatISO(addMonths(new Date(), -1)), // Expired
    isActive: false, // Also inactive
    timesUsed: 50,
    usageLimit: 50,
    description: 'Kupon peluncuran (kadaluwarsa & tidak aktif)',
  },
  {
    id: 'CPN004',
    code: 'NOLIMIT',
    discountType: 'fixed',
    discountValue: 10000,
    expiryDate: formatISO(addMonths(new Date(), 6)),
    isActive: true,
    timesUsed: 2,
    // No usageLimit means unlimited uses (practically)
    // No minPurchase means no minimum purchase
    description: 'Potongan Rp10.000 tanpa batas penggunaan atau min. pembelian.',
  },
];

export const MOCK_USERS: User[] = [
  {
    id: 'usr_001',
    name: 'Adam',
    email: 'adamtest123@mailnesia.com',
    avatarUrl: 'https://placehold.co/80x80.png',
    roles: ['affiliate'],
    accountStatus: 'Aktif',
    joinDate: formatISO(subDays(new Date(), 60)), // Joined 60 days ago
    lastLogin: 'N/A',
    totalPurchases: 0,
    ticketsPurchased: 0,
    affiliateCode: 'ADAMXYZ',
    bankDetails: {
        bankName: 'Bank Fiktif Cabang Keren',
        accountNumber: '9876543210',
        accountHolderName: 'Adam Perkasa',
    }
  },
  {
    id: 'usr_002',
    name: 'Budi Santoso',
    email: 'budisantoso@mailnesia.com',
    avatarUrl: 'https://placehold.co/80x80.png',
    roles: ['customer', 'affiliate'],
    accountStatus: 'Aktif',
    joinDate: formatISO(subDays(new Date(), 30)), // Joined 30 days ago
    lastLogin: formatISO(subDays(new Date(), 2)), // Last login 2 days ago
    totalPurchases: 350000,
    ticketsPurchased: 2,
    affiliateCode: 'BUDIREF',
  },
  {
    id: 'usr_003',
    name: 'Admin Webmaster',
    email: 'zanuradigital@gmail.com',
    avatarUrl: 'https://placehold.co/80x80.png',
    roles: ['admin', 'affiliate'],
    accountStatus: 'Aktif',
    joinDate: formatISO(subDays(new Date(), 120)), // Joined 120 days ago
    lastLogin: formatISO(new Date()), // Last login today
    totalPurchases: 0,
    ticketsPurchased: 0,
    affiliateCode: 'AFFADMINXYZ',
    bankDetails: {
        bankName: 'Bank Admin Sejahtera',
        accountNumber: '1122334455',
        accountHolderName: 'Admin Webmaster Utama',
    }
  },
  {
    id: 'usr_004',
    name: 'Citra Ayu',
    email: 'citra.ayu@example.com',
    avatarUrl: 'https://placehold.co/80x80.png',
    roles: ['customer'],
    accountStatus: 'Aktif',
    joinDate: formatISO(subDays(new Date(), 10)),
    lastLogin: formatISO(subDays(new Date(), 1)),
    totalPurchases: 150000,
    ticketsPurchased: 1,
  },
  {
    id: 'usr_005',
    name: 'Dewi Lestari',
    email: 'dewi.lestari@example.net',
    avatarUrl: 'https://placehold.co/80x80.png',
    roles: ['customer'],
    accountStatus: 'Ditangguhkan',
    joinDate: formatISO(subDays(new Date(), 90)),
    lastLogin: formatISO(subDays(new Date(), 30)),
    totalPurchases: 75000,
    ticketsPurchased: 1,
  },
];
