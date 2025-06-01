
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
  bookingDate: string;
  paymentStatus: 'pending' | 'paid' | 'failed';
  couponCode?: string; // Replaces referralCode
  discountAmount?: number; // Amount discounted by coupon
  selectedTierName?: string;
  selectedTierPrice?: number;
  usedReferralCode?: string; // For tracking which affiliate's code was used by buyer
  ticket_pdf_url?: string; // URL ke PDF tiket yang digenerate
}

export interface Affiliate {
  id: string;
  name: string;
  email: string;
  referralCode: string; // This is the affiliate's own code to share
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
  usageLimit?: number; // Optional: total number of times this coupon can be used
  timesUsed: number; // How many times this coupon has been used
  minPurchase?: number; // Optional: minimum purchase amount to use this coupon
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
  joinDate: string; // ISO string date
  lastLogin?: string; // ISO string date or 'N/A'
  totalPurchases: number;
  ticketsPurchased: number;
  affiliateCode?: string; // If user is an affiliate
  bankDetails?: UserBankDetails; // Added for affiliate payment
}

