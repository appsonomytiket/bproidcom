-- Enable RLS for the events table
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access to events
-- This allows anyone (anonymous or authenticated) to select event data.
CREATE POLICY "Allow public read access to events"
ON public.events
FOR SELECT
USING (true);

-- Policy: Allow admin full access to events
-- This allows users who have the 'admin' role in the public.users table
-- to perform any operation (SELECT, INSERT, UPDATE, DELETE) on the events table.
-- The public.users table is assumed to have an 'id' column that is a foreign key
-- to auth.users.id, and a 'roles' jsonb column (e.g., '["admin"]').
CREATE POLICY "Allow admin full access to events"
ON public.events
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
