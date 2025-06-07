-- Add check-in related columns to the bookings table

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS checked_in BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;

COMMENT ON COLUMN public.bookings.checked_in IS 'Indicates if the ticket associated with this booking has been checked in.';
COMMENT ON COLUMN public.bookings.checked_in_at IS 'Timestamp of when the ticket was checked in.';

-- Add an index for faster lookups on checked_in status, if frequently queried
CREATE INDEX IF NOT EXISTS idx_bookings_checked_in ON public.bookings(checked_in);
