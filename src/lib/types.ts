
export interface Event {
  id: string;
  name: string;
  date: string;
  location: string;
  price: number;
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
  referralCode?: string; // Generated after booking
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
