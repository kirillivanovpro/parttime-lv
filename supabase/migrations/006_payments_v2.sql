-- ============================================================
-- Migration 006: Recreate payments table with updated schema
-- Drops old payments table and creates new structure
-- Also adds contact_unlocks table for tracking unlocked contacts
-- ============================================================

-- Drop old payments table (CASCADE removes trigger)
DROP TABLE IF EXISTS public.payments CASCADE;

-- ============================================================
-- payments table (v2)
-- Logs Stripe checkout sessions and payment intents
-- ============================================================
CREATE TABLE public.payments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type              text NOT NULL CHECK (type IN ('job_posting','contact_unlock')),
  amount            int  NOT NULL,           -- in cents (30 = 0.30 EUR)
  currency          text NOT NULL DEFAULT 'eur',
  stripe_session_id text,                    -- Stripe Checkout Session id
  stripe_payment_id text UNIQUE,             -- Stripe PaymentIntent id (set on completion)
  status            text NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','completed','failed')),
  metadata          jsonb DEFAULT '{}',
  created_at        timestamptz DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Users can read their own payments
CREATE POLICY "Payments: user reads own" ON public.payments
  FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own payments (creates pending record before Stripe redirect)
CREATE POLICY "Payments: user inserts own" ON public.payments
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================================
-- contact_unlocks table
-- Tracks which seekers have unlocked contact info for which jobs
-- ============================================================
CREATE TABLE public.contact_unlocks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seeker_id   uuid NOT NULL REFERENCES public.seeker_profiles(id) ON DELETE CASCADE,
  job_id      uuid NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
  payment_id  uuid REFERENCES public.payments(id) ON DELETE SET NULL,
  unlocked_at timestamptz DEFAULT now(),
  UNIQUE(seeker_id, job_id)
);

ALTER TABLE public.contact_unlocks ENABLE ROW LEVEL SECURITY;

-- Seekers can read their own unlocks (via seeker_profiles ownership)
CREATE POLICY "Unlocks: seeker reads own" ON public.contact_unlocks
  FOR SELECT USING (
    seeker_id IN (SELECT id FROM public.seeker_profiles WHERE user_id = auth.uid())
  );

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX idx_payments_user_id         ON public.payments(user_id);
CREATE INDEX idx_payments_stripe_session  ON public.payments(stripe_session_id) WHERE stripe_session_id IS NOT NULL;
CREATE INDEX idx_contact_unlocks_seeker   ON public.contact_unlocks(seeker_id);
CREATE INDEX idx_contact_unlocks_job      ON public.contact_unlocks(job_id);
