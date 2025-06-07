'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';

// Define types for affiliate data - consider moving to src/lib/types.ts
interface AffiliateStats {
  totalReferrals: number;
  totalCommissionsEarned: number;
  availableBalance: number;
  referralCode: string | null;
}

interface Commission {
  id: string;
  booking_id: string;
  amount: number;
  status: string;
  created_at: string;
  withdrawal_request_id?: string | null; // Added for checking if part of a withdrawal
  // Add event_name or buyer_name if needed by joining tables in Supabase query
}

interface Withdrawal {
  id: string;
  requested_amount: number;
  status: string;
  requested_at: string;
  processed_at?: string;
  admin_notes?: string;
}

export default function AffiliateDashboardPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);

  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [bankDetails, setBankDetails] = useState({ name: '', accountNumber: '', accountHolderName: '' });

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        fetchAffiliateData(session.user.id);
      } else {
        setLoading(false);
      }
    };
    getUser();
  }, [supabase]);

  const fetchAffiliateData = async (userId: string) => {
    setLoading(true);
    try {
      // Fetch user's referral code from public.users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('referral_code, full_name') // Assuming full_name exists for referral code generation if needed
        .eq('id', userId)
        .single();

      if (userError) throw userError;
      
      let currentReferralCode = userData?.referral_code;

      // If user doesn't have a referral code, try to generate one (or prompt admin activation)
      // For now, we assume they get one automatically or admin activates them.
      // A button "Become an Affiliate" could call an edge function to generate it.
      if (!currentReferralCode && userData?.full_name) {
        // This is a client-side placeholder. Actual code generation should be via Edge Function.
        // console.log("User has no referral code. Admin should activate or a function should create it.");
        // For demo, we can show a message or a button to request activation.
      }


      // Fetch commissions
      const { data: commissionsData, error: commissionsError } = await supabase
        .from('commissions')
        .select('*')
        .eq('affiliate_user_id', userId)
        .order('created_at', { ascending: false });
      if (commissionsError) throw commissionsError;
      setCommissions(commissionsData || []);

      // Fetch withdrawals
      const { data: withdrawalsData, error: withdrawalsError } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('affiliate_user_id', userId)
        .order('requested_at', { ascending: false });
      if (withdrawalsError) throw withdrawalsError;
      setWithdrawals(withdrawalsData || []);

      // Calculate stats
      const totalEarned = commissionsData?.reduce((sum: number, c: Commission) => c.status === 'paid' ? sum + c.amount : sum, 0) || 0;
      const pendingCommissions = commissionsData?.filter((c: Commission) => c.status === 'pending' && !c.withdrawal_request_id) || [];
      const available = pendingCommissions.reduce((sum: number, c: Commission) => sum + c.amount, 0);
      
      setStats({
        totalReferrals: commissionsData?.length || 0, // Simplistic: counts commission entries
        totalCommissionsEarned: totalEarned,
        availableBalance: available,
        referralCode: currentReferralCode,
      });

    } catch (error: any) {
      console.error('Error fetching affiliate data:', error);
      toast({ title: 'Error', description: error.message || 'Could not fetch affiliate data.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !stats) return;
    const amount = parseFloat(withdrawalAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Error', description: 'Please enter a valid withdrawal amount.' });
      return;
    }
    // TODO: Add minimum withdrawal amount check from admin settings
    if (amount > stats.availableBalance) {
      toast({ title: 'Error', description: 'Requested amount exceeds available balance.' });
      return;
    }
    if (!bankDetails.name || !bankDetails.accountNumber || !bankDetails.accountHolderName) {
        toast({ title: 'Error', description: 'Please provide complete bank details.' });
        return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.functions.invoke('request-withdrawal', {
        body: { 
            requested_amount: amount,
            bank_name: bankDetails.name,
            bank_account_number: bankDetails.accountNumber,
            bank_account_holder_name: bankDetails.accountHolderName,
        },
      });
      if (error) throw error;
      toast({ title: 'Success', description: 'Withdrawal request submitted.' });
      setWithdrawalAmount('');
      // Optionally clear bank details or keep them for next time
      fetchAffiliateData(user.id); // Refresh data
    } catch (error: any) {
      console.error('Error requesting withdrawal:', error);
      toast({ title: 'Error', description: error.message || 'Failed to submit withdrawal request.' });
    } finally {
      setLoading(false);
    }
  };
  
  const handleCopyReferralCode = () => {
    if (stats?.referralCode) {
      navigator.clipboard.writeText(`${window.location.origin}/register?ref=${stats.referralCode}`)
        .then(() => toast({ title: 'Copied!', description: 'Referral link copied to clipboard.' }))
        .catch(err => toast({ title: 'Error', description: 'Could not copy link.' }));
    }
  };


  if (loading && !stats) { // Show full page loader only on initial load
    return <div className="container mx-auto p-4">Loading affiliate dashboard...</div>;
  }

  if (!user) {
    return <div className="container mx-auto p-4">Please log in to view your affiliate dashboard.</div>;
  }
  
  if (!stats?.referralCode && !loading) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Become an Affiliate</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You are not yet an affiliate. Please contact an administrator to activate your affiliate account.</p>
            {/* Optionally, add a button here to call an 'request-affiliate-activation' function if you build one */}
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-3xl font-bold">Affiliate Dashboard</h1>

      <Card>
        <CardHeader>
          <CardTitle>Your Referral Code</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center space-x-4">
          {stats?.referralCode ? (
            <>
              <Input type="text" value={stats.referralCode} readOnly className="font-mono text-lg" />
              <Button onClick={handleCopyReferralCode}>Copy Link</Button>
            </>
          ) : (
            <p>Your referral code is not yet active. Contact admin.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle>Total Referrals</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{stats?.totalReferrals ?? 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Total Commissions Paid</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">Rp {stats?.totalCommissionsEarned.toLocaleString('id-ID') ?? 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Available Balance (Pending)</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">Rp {stats?.availableBalance.toLocaleString('id-ID') ?? 0}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Request Withdrawal</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleRequestWithdrawal} className="space-y-4">
            <div>
              <Label htmlFor="withdrawalAmount">Amount to Withdraw (IDR)</Label>
              <Input id="withdrawalAmount" type="number" value={withdrawalAmount} onChange={(e) => setWithdrawalAmount(e.target.value)} placeholder="e.g., 50000" required />
            </div>
            <div>
              <Label htmlFor="bankName">Bank Name</Label>
              <Input id="bankName" type="text" value={bankDetails.name} onChange={(e) => setBankDetails({...bankDetails, name: e.target.value})} placeholder="e.g., Bank Central Asia" required />
            </div>
            <div>
              <Label htmlFor="accountNumber">Bank Account Number</Label>
              <Input id="accountNumber" type="text" value={bankDetails.accountNumber} onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})} placeholder="e.g., 1234567890" required />
            </div>
            <div>
              <Label htmlFor="accountHolderName">Bank Account Holder Name</Label>
              <Input id="accountHolderName" type="text" value={bankDetails.accountHolderName} onChange={(e) => setBankDetails({...bankDetails, accountHolderName: e.target.value})} placeholder="e.g., John Doe" required />
            </div>
            <Button type="submit" disabled={loading || !stats || stats.availableBalance <= 0}>
              {loading ? 'Submitting...' : 'Request Withdrawal'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>My Commissions</CardTitle></CardHeader>
        <CardContent>
          {commissions.length === 0 ? (<p>No commissions yet.</p>) : (
            <ul className="space-y-2">
              {commissions.map(c => (
                <li key={c.id} className="p-2 border rounded">
                  Amount: Rp {c.amount.toLocaleString('id-ID')} - Status: {c.status} - Date: {new Date(c.created_at).toLocaleDateString()}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Withdrawal History</CardTitle></CardHeader>
        <CardContent>
          {withdrawals.length === 0 ? (<p>No withdrawal requests yet.</p>) : (
            <ul className="space-y-2">
              {withdrawals.map(w => (
                <li key={w.id} className="p-2 border rounded">
                  Amount: Rp {w.requested_amount.toLocaleString('id-ID')} - Status: {w.status} - Requested: {new Date(w.requested_at).toLocaleDateString()}
                  {w.processed_at && ` - Processed: ${new Date(w.processed_at).toLocaleDateString()}`}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
