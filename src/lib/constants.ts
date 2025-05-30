
import type { Event, Booking, Affiliate, AdminSaleData, AdminCommissionData } from './types';

export const MOCK_EVENTS: Event[] = [
  {
    id: '1',
    name: 'Konser Musik Merdeka',
    date: '2024-08-17T19:00:00Z',
    location: 'Lapangan Banteng, Jakarta',
    price: 150000,
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
    price: 750000,
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
    price: 50000,
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
    price: 25000, // Entry fee
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
    totalPrice: 300000,
    bookingDate: '2024-07-20T10:00:00Z',
    paymentStatus: 'pending',
    referralCode: 'ANDI123XYZ',
  },
  {
    id: 'BK002',
    eventId: '2',
    eventName: 'Workshop Digital Marketing 2024',
    userName: 'Budi Santoso',
    userEmail: 'budi@example.com',
    tickets: 1,
    totalPrice: 750000,
    bookingDate: '2024-07-22T14:30:00Z',
    paymentStatus: 'paid',
    referralCode: 'BUDI456ABC',
  },
];

export const MOCK_AFFILIATE_DATA: Affiliate = {
  id: 'AFF001',
  name: 'Citra Lestari',
  email: 'citra.lestari@example.com',
  referralCode: 'CITRA789REF',
  totalEarnings: 1250000,
  withdrawalHistory: [
    { date: '2024-06-15', amount: 500000, status: 'Completed' },
    { date: '2024-07-10', amount: 750000, status: 'Processing' },
  ],
  referredSales: [
    { bookingId: 'BK003', eventName: 'Konser Musik Merdeka', commission: 75000, date: '2024-07-25' },
    { bookingId: 'BK004', eventName: 'Workshop Digital Marketing', commission: 150000, date: '2024-07-28' },
  ],
};

export const MOCK_ADMIN_SALES_DATA: AdminSaleData[] = [
  { month: 'Jan', sales: 4000 },
  { month: 'Feb', sales: 3000 },
  { month: 'Mar', sales: 5000 },
  { month: 'Apr', sales: 4500 },
  { month: 'May', sales: 6000 },
  { month: 'Jun', sales: 5500 },
];

export const MOCK_ADMIN_COMMISSION_DATA: AdminCommissionData[] = [
  { month: 'Jan', commissions: 400 },
  { month: 'Feb', commissions: 300 },
  { month: 'Mar', commissions: 500 },
  { month: 'Apr', commissions: 450 },
  { month: 'May', commissions: 600 },
  { month: 'Jun', commissions: 550 },
];

export const MOCK_RECENT_BOOKINGS_ADMIN: Booking[] = [
  ...MOCK_BOOKINGS,
  {
    id: 'BK003',
    eventId: '1',
    eventName: 'Konser Musik Merdeka',
    userName: 'Dewi Anggraini',
    userEmail: 'dewi@example.com',
    tickets: 1,
    totalPrice: 150000,
    bookingDate: '2024-07-28T11:00:00Z',
    paymentStatus: 'paid',
  },
  {
    id: 'BK004',
    eventId: '3',
    eventName: 'Pameran Seni Kontemporer "Ruang Kita"',
    userName: 'Eko Wijaya',
    userEmail: 'eko@example.com',
    tickets: 3,
    totalPrice: 150000,
    bookingDate: '2024-07-29T16:15:00Z',
    paymentStatus: 'pending',
  },
];

export const MOCK_TOP_AFFILIATES_ADMIN: Omit<Affiliate, 'withdrawalHistory' | 'referredSales' | 'email'>[] = [
  { id: 'AFF001', name: 'Citra Lestari', referralCode: 'CITRA789REF', totalEarnings: 1250000 },
  { id: 'AFF002', name: 'Rian Hidayat', referralCode: 'RIANXYZREF', totalEarnings: 980000 },
  { id: 'AFF003', name: 'Siti Aminah', referralCode: 'SITI123REF', totalEarnings: 750000 },
];
