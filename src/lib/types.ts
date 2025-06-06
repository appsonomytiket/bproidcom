
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
  totalPrice: number; // This will be the final price after discount
  bookingDate: string; // ISO string date of booking creation
  paymentStatus: 'pending' | 'paid' | 'failed' | 'expired' | 'cancelled';
  couponCode?: string;
  discountAmount?: number;
  selectedTierName?: string;
  selectedTierPrice?: number;
  usedReferralCode?: string;
  buyerReferralCode?: string;
  ticket_pdf_url?: string;
  midtrans_token?: string; // Token from Midtrans to be used by Snap.js
  midtrans_redirect_url?: string; // Alternative redirect URL from Midtrans
  midtrans_order_id?: string; // Usually same as booking id, for Midtrans reference
  checked_in: boolean; // Default to false
  checked_in_at?: string; // ISO string date when ticket was checked in
  created_at?: string; // Supabase default
  updated_at?: string; // Supabase default
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
  id: string;
  affiliateId: string;
  affiliateName: string;
  date: string;
  amount: number;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  expiryDate: string;
  isActive: boolean;
  usageLimit?: number;
  timesUsed: number;
  minPurchase?: number;
  description?: string;
}

export type UserRole = 'admin' | 'affiliate' | 'customer';

export interface UserBankDetails {
  bankName?: string;
  accountNumber?: string;
  accountHolderName?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  roles: UserRole[];
  accountStatus: 'Aktif' | 'Ditangguhkan' | 'Tidak Aktif';
  joinDate: string;
  lastLogin?: string;
  totalPurchases: number;
  ticketsPurchased: number;
  affiliateCode?: string;
  bankDetails?: UserBankDetails;
}
