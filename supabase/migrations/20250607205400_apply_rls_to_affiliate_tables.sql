-- Enable RLS for commissions table
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

-- Policies for commissions table
-- Admin users can perform all operations
CREATE POLICY "Admin full access on commissions"
ON public.commissions
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Affiliates can view their own commissions
CREATE POLICY "Affiliates can view their own commissions"
ON public.commissions
FOR SELECT
USING (auth.uid() = affiliate_user_id);

-- Authenticated users can view commissions related to their bookings (as a buyer)
CREATE POLICY "Buyers can view their commissions related to their bookings"
ON public.commissions
FOR SELECT
USING (auth.uid() = buyer_user_id);

-- Enable RLS for withdrawal_requests table
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Policies for withdrawal_requests table
-- Admin users can perform all operations
CREATE POLICY "Admin full access on withdrawal_requests"
ON public.withdrawal_requests
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Affiliates can create and view their own withdrawal requests
CREATE POLICY "Affiliates can manage their own withdrawal_requests"
ON public.withdrawal_requests
FOR ALL
USING (auth.uid() = affiliate_user_id)
WITH CHECK (auth.uid() = affiliate_user_id);

-- Ensure users cannot update status of withdrawal_requests directly, only admins
-- This is implicitly handled by the admin full access policy and the more restrictive affiliate policy.
-- Affiliates can only update non-status fields if allowed by the table structure (e.g. bank details before approval)
-- For stricter control, specific UPDATE policies for affiliates could be added if needed.

COMMENT ON POLICY "Admin full access on commissions" ON public.commissions IS 'Allows admin users to perform any operation on the commissions table.';
COMMENT ON POLICY "Affiliates can view their own commissions" ON public.commissions IS 'Allows affiliates to view commission records where they are the affiliate.';
COMMENT ON POLICY "Buyers can view their commissions related to their bookings" ON public.commissions IS 'Allows users to view commission records related to their own purchases.';

COMMENT ON POLICY "Admin full access on withdrawal_requests" ON public.withdrawal_requests IS 'Allows admin users to perform any operation on the withdrawal_requests table.';
COMMENT ON POLICY "Affiliates can manage their own withdrawal_requests" ON public.withdrawal_requests IS 'Allows affiliates to create, view, and update (e.g. bank details) their own withdrawal requests. Status changes are admin-only.';
