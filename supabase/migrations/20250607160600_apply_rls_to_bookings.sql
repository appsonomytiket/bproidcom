-- Enable RLS for the bookings table
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to view their own bookings
CREATE POLICY "Users can view their own bookings"
ON public.bookings
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Allow admins to view all bookings
CREATE POLICY "Admins can view all bookings"
ON public.bookings
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.users
    WHERE public.users.id = auth.uid() AND public.users.roles @> '["admin"]'::jsonb
  )
);

-- Policy: Allow admins to update bookings
CREATE POLICY "Admins can update bookings"
ON public.bookings
FOR UPDATE
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

-- Policy: Allow admins to delete bookings
CREATE POLICY "Admins can delete bookings"
ON public.bookings
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.users
    WHERE public.users.id = auth.uid() AND public.users.roles @> '["admin"]'::jsonb
  )
);

-- Note on INSERT:
-- Bookings are typically created by the `initiate-payment` Edge Function.
-- This function should use the `service_role` key, which bypasses RLS.
-- Therefore, an explicit INSERT policy for users is generally not needed and could be a security risk.
-- If non-admin users were ever intended to insert directly (not recommended for this flow),
-- a policy like `CREATE POLICY "Users can create their own bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);`
-- would be required, but this is intentionally omitted.

-- Note on specific updates by Edge Functions (e.g., midtrans-webhook updating payment_status):
-- These functions should also use the `service_role` key to bypass RLS for these specific, trusted operations.
