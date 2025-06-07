-- Enable RLS for the users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to view their own profile
CREATE POLICY "Users can view their own profile"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- Policy: Allow users to update their own profile
-- Note: The application should ensure only specific columns (e.g., name, avatar_url, bank_details)
-- are modifiable by the user through the frontend/API.
CREATE POLICY "Users can update their own profile"
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy: Allow admins to view all user profiles
CREATE POLICY "Admins can view all user profiles"
ON public.users
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.users u_check
    WHERE u_check.id = auth.uid() AND u_check.roles @> '["admin"]'::jsonb
  )
);

-- Policy: Allow admins to update all user profiles
-- This is for administrative tasks like changing roles or account status.
CREATE POLICY "Admins can update all user profiles"
ON public.users
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.users u_check
    WHERE u_check.id = auth.uid() AND u_check.roles @> '["admin"]'::jsonb
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.users u_check
    WHERE u_check.id = auth.uid() AND u_check.roles @> '["admin"]'::jsonb
  )
);

-- Note: For DELETE operations on the users table, it's generally safer to handle them
-- via specific admin functions or by deactivating accounts rather than direct RLS delete policies
-- for regular users. Admins might need a delete policy, but it should be used with caution.
-- For now, no explicit DELETE policies are added for users or general admins.
-- If an admin needs to delete a user, they might need a more privileged role or a specific function.
