'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

// Types - consider moving to src/lib/types.ts if not already there
interface ManagedUser {
  id: string;
  email?: string;
  full_name?: string;
  referral_code?: string | null;
  created_at: string;
}

interface AdminWithdrawalRequest {
  id: string;
  affiliate_user_id: string;
  affiliate_email?: string; // Joined data
  affiliate_name?: string; // Joined data
  requested_amount: number;
  status: string;
  requested_at: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_holder_name?: string;
}

export default function AffiliatesManagementPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<AdminWithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<AdminWithdrawalRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchAdminAffiliateData();
  }, []);

  const fetchAdminAffiliateData = async () => {
    setLoading(true);
    try {
      // Fetch all users with their affiliate status (referral_code)
      const { data: usersData, error: usersError } = await supabase
        .from('users') // Assuming public.users table
        .select('id, email, full_name, referral_code, created_at')
        .order('created_at', { ascending: false });
      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Fetch pending withdrawal requests and join with user details for display
      const { data: withdrawalsData, error: withdrawalsError } = await supabase
        .from('withdrawal_requests')
        .select(`
          id,
          requested_amount,
          status,
          requested_at,
          bank_name,
          bank_account_number,
          bank_account_holder_name,
          affiliate_user_id,
          users ( email, full_name )
        `)
        .eq('status', 'pending') // Only show pending ones for action
        .order('requested_at', { ascending: true });
        
      if (withdrawalsError) throw withdrawalsError;
      
      const formattedWithdrawals = withdrawalsData?.map((w: any) => ({
        ...w,
        affiliate_email: w.users?.email,
        affiliate_name: w.users?.full_name,
      })) || [];
      setWithdrawalRequests(formattedWithdrawals);

    } catch (error: any) {
      console.error('Error fetching admin affiliate data:', error);
      toast({ title: 'Error', description: error.message || 'Could not fetch data.' });
    } finally {
      setLoading(false);
    }
  };

  const handleActivateAffiliate = async (userId: string) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase.functions.invoke('activate-affiliate', {
        body: { user_id_to_activate: userId },
      });
      if (error) throw error;
      toast({ title: 'Success', description: 'Affiliate activated/status confirmed.' });
      fetchAdminAffiliateData(); // Refresh users list
    } catch (error: any) {
      console.error('Error activating affiliate:', error);
      toast({ title: 'Error', description: error.message || 'Failed to activate affiliate.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessWithdrawal = async (action: 'approve' | 'reject') => {
    if (!selectedWithdrawal) return;
    setIsProcessing(true);
    try {
      const { error } = await supabase.functions.invoke('process-withdrawal', {
        body: {
          withdrawal_request_id: selectedWithdrawal.id,
          action: action,
          admin_notes: adminNotes,
        },
      });
      if (error) throw error;
      toast({ title: 'Success', description: `Withdrawal request ${action}d.` });
      setSelectedWithdrawal(null);
      setAdminNotes('');
      fetchAdminAffiliateData(); // Refresh withdrawals list
    } catch (error: any) {
      console.error(`Error processing withdrawal (${action}):`, error);
      toast({ title: 'Error', description: error.message || `Failed to ${action} withdrawal.` });
    } finally {
      setIsProcessing(false);
    }
  };


  if (loading) {
    return <div className="container mx-auto p-4">Loading affiliate management data...</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-3xl font-bold">Affiliates Management</h1>

      <Card>
        <CardHeader>
          <CardTitle>User Affiliate Status</CardTitle>
          <CardDescription>Manage user affiliate activations.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Referral Code</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.full_name || 'N/A'}</TableCell>
                  <TableCell>{user.email || 'N/A'}</TableCell>
                  <TableCell>{user.referral_code || 'Not Active'}</TableCell>
                  <TableCell>
                    {!user.referral_code && (
                      <Button onClick={() => handleActivateAffiliate(user.id)} size="sm" disabled={isProcessing}>
                        {isProcessing ? 'Activating...' : 'Activate'}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending Withdrawal Requests</CardTitle>
          <CardDescription>Approve or reject pending withdrawal requests.</CardDescription>
        </CardHeader>
        <CardContent>
          {withdrawalRequests.length === 0 ? (<p>No pending withdrawal requests.</p>) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Affiliate</TableHead>
                  <TableHead>Amount (IDR)</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead>Requested At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawalRequests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>{req.affiliate_name || req.affiliate_email || req.affiliate_user_id}</TableCell>
                    <TableCell>{req.requested_amount.toLocaleString('id-ID')}</TableCell>
                    <TableCell>{req.bank_name} - {req.bank_account_number} ({req.bank_account_holder_name})</TableCell>
                    <TableCell>{new Date(req.requested_at).toLocaleString()}</TableCell>
                    <TableCell>
                      <DialogTrigger asChild>
                        <Button onClick={() => setSelectedWithdrawal(req)} size="sm" disabled={isProcessing}>
                          Process
                        </Button>
                      </DialogTrigger>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedWithdrawal && (
        <Dialog open={!!selectedWithdrawal} onOpenChange={(isOpen) => !isOpen && setSelectedWithdrawal(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Process Withdrawal for {selectedWithdrawal.affiliate_name || selectedWithdrawal.affiliate_email}</DialogTitle>
              <DialogDescription>
                Amount: Rp {selectedWithdrawal.requested_amount.toLocaleString('id-ID')}<br/>
                Bank: {selectedWithdrawal.bank_name} - {selectedWithdrawal.bank_account_number} ({selectedWithdrawal.bank_account_holder_name})<br/>
                Requested: {new Date(selectedWithdrawal.requested_at).toLocaleString()}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="adminNotes">Admin Notes (Optional)</Label>
              <Textarea 
                id="adminNotes" 
                value={adminNotes} 
                onChange={(e) => setAdminNotes(e.target.value)} 
                placeholder="e.g., Payment processed via Xoom." 
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedWithdrawal(null)} disabled={isProcessing}>Cancel</Button>
              <Button variant="destructive" onClick={() => handleProcessWithdrawal('reject')} disabled={isProcessing}>
                {isProcessing ? 'Rejecting...' : 'Reject'}
              </Button>
              <Button onClick={() => handleProcessWithdrawal('approve')} disabled={isProcessing}>
                {isProcessing ? 'Approving...' : 'Approve'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
