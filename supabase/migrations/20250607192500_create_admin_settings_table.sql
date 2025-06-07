CREATE TABLE public.admin_settings (
  id TEXT PRIMARY KEY DEFAULT 'global', -- Using a fixed ID for a single row of global settings
  site_name TEXT,
  default_event_image_url TEXT,
  contact_email TEXT,
  meta_pixel_id TEXT,
  google_analytics_id TEXT,
  manual_payment_bank_name TEXT,
  manual_payment_account_number TEXT,
  manual_payment_account_holder_name TEXT,
  manual_payment_whatsapp TEXT,
  midtrans_is_production BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Allow admins to read settings
CREATE POLICY "Allow admin read access to admin_settings"
ON public.admin_settings
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.users
    WHERE public.users.id = auth.uid() AND public.users.roles @> '["admin"]'::jsonb
  )
);

-- Allow admins to update settings
CREATE POLICY "Allow admin update access to admin_settings"
ON public.admin_settings
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

-- Insert a default row of settings if it doesn't exist.
-- This ensures the 'global' settings row is always available.
INSERT INTO public.admin_settings (
  id, 
  site_name, 
  contact_email, 
  midtrans_is_production,
  meta_pixel_id,
  google_analytics_id
)
VALUES (
  'global', 
  'Bproid Events', 
  'admin@bproid.com',
  FALSE, -- Default Midtrans mode to Sandbox
  '',
  ''
)
ON CONFLICT (id) DO UPDATE SET 
  site_name = EXCLUDED.site_name, -- Ensure existing rows get default values if they are missing these columns
  contact_email = EXCLUDED.contact_email,
  midtrans_is_production = COALESCE(public.admin_settings.midtrans_is_production, EXCLUDED.midtrans_is_production),
  meta_pixel_id = COALESCE(public.admin_settings.meta_pixel_id, EXCLUDED.meta_pixel_id),
  google_analytics_id = COALESCE(public.admin_settings.google_analytics_id, EXCLUDED.google_analytics_id);


-- Trigger to update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION public.handle_admin_settings_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_admin_settings_update
  BEFORE UPDATE ON public.admin_settings
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_admin_settings_update();
