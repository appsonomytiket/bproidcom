-- Enable RLS for the coupons table
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access to active and non-expired coupons
-- This allows anyone to see coupons that can potentially be used.
CREATE POLICY "Allow public read access to active coupons"
ON public.coupons
FOR SELECT
USING (is_active = true AND expiry_date > now());

-- Policy: Allow admin full access to coupons
-- This allows users with the 'admin' role to manage all coupons.
CREATE POLICY "Allow admin full access to coupons"
ON public.coupons
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.users
    WHERE public.users.id = auth.uid() AND public.users.roles @> '["admin"]'::jsonb
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.users
    WHERE public.users.id = auth.uid() AND public.users.roles @> '["admin"]'::jsonb
  )
);
