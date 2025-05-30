
export interface EventPriceTier {
  name: string;
  price: number;
}

export interface Event {
  id: string;
  name: string;
  date: string;
  location: string;
  priceTiers: EventPriceTier[];
  description: string;
  imageUrl: string;
  organizer: string;
  category: string;
  availableTickets: number;
}

export interface Booking {
  id: string;
  eventId: string;
  eventName: string;
  userName: string;
  userEmail: string;
  tickets: number;
  totalPrice: number;
  bookingDate: string;
  paymentStatus: 'pending' | 'paid' | 'failed';
  referralCode?: string;
  selectedTierName?: string;
  selectedTierPrice?: number;
}

export interface Affiliate {
  id: string;
  name: string;
  email: string;
  referralCode: string;
  totalEarnings: number;
  withdrawalHistory: { date: string; amount: number; status: string }[];
  referredSales: { bookingId: string; eventName: string; commission: number; date: string }[];
}

export interface AdminSaleData {
  month: string;
  sales: number;
}

export interface AdminCommissionData {
  month: string;
  commissions: number;
}

export interface AdminWithdrawalRequest {
  id: string; // Withdrawal ID
  affiliateId: string;
  affiliateName: string;
  date: string; // ISO string date
  amount: number;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed'; // Admin-centric statuses
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  expiryDate: string; // ISO string date
  isActive: boolean;
  usageLimit?: number;
  timesUsed: number;
  minPurchase?: number;
  description?: string;
}

export type UserRole = 'admin' | 'affiliate' | 'customer';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  roles: UserRole[];
  accountStatus: 'Aktif' | 'Ditangguhkan' | 'Tidak Aktif';
  joinDate: string; // ISO string date
  lastLogin?: string; // ISO string date or 'N/A'
  totalPurchases: number;
  ticketsPurchased: number;
  affiliateCode?: string; // If user is an affiliate
}
