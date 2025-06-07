-- Add referral_code to users table
ALTER TABLE public.users
ADD COLUMN referral_code TEXT UNIQUE;

-- Add used_referral_code to bookings table
ALTER TABLE public.bookings
ADD COLUMN used_referral_code TEXT;

-- Create commissions table
CREATE TABLE public.commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id),
    affiliate_user_id UUID NOT NULL REFERENCES public.users(id),
    buyer_user_id UUID NOT NULL REFERENCES public.users(id),
    amount NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- e.g., pending, paid, cancelled
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    paid_at TIMESTAMPTZ,
    withdrawal_request_id UUID REFERENCES public.withdrawal_requests(id)
);

-- Create withdrawal_requests table
CREATE TABLE public.withdrawal_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_user_id UUID NOT NULL REFERENCES public.users(id),
    requested_amount NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- e.g., pending, approved, rejected, processed
    requested_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    processed_at TIMESTAMPTZ,
    admin_notes TEXT,
    bank_name TEXT,
    bank_account_number TEXT,
    bank_account_holder_name TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add indexes for frequently queried columns
CREATE INDEX idx_commissions_affiliate_user_id ON public.commissions(affiliate_user_id);
CREATE INDEX idx_commissions_status ON public.commissions(status);
CREATE INDEX idx_withdrawal_requests_affiliate_user_id ON public.withdrawal_requests(affiliate_user_id);
CREATE INDEX idx_withdrawal_requests_status ON public.withdrawal_requests(status);

-- Trigger to update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_commissions_updated_at
BEFORE UPDATE ON public.commissions
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_withdrawal_requests_updated_at
BEFORE UPDATE ON public.withdrawal_requests
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

COMMENT ON COLUMN public.users.referral_code IS 'Unique referral code for the user, used for the affiliate system.';
COMMENT ON COLUMN public.bookings.used_referral_code IS 'Referral code used for this booking, if any.';
COMMENT ON TABLE public.commissions IS 'Stores commission records for affiliate referrals.';
COMMENT ON COLUMN public.commissions.status IS 'Status of the commission (e.g., pending, paid, cancelled).';
COMMENT ON TABLE public.withdrawal_requests IS 'Stores affiliate requests to withdraw their earned commissions.';
COMMENT ON COLUMN public.withdrawal_requests.status IS 'Status of the withdrawal request (e.g., pending, approved, rejected, processed).';
