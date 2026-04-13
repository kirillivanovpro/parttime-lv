-- ============================================================
-- payments table
-- Logs every Stripe event; used for idempotency and audit trail
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_id   text NOT NULL,           -- Stripe session or payment_intent id
  stripe_event_id     text,                    -- webhook event id for deduplication
  type                text NOT NULL            -- 'job_posting' | 'contact_unlock'
                        CHECK (type IN ('job_posting', 'contact_unlock')),
  status              text NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  amount_eur          int  NOT NULL,           -- amount in euro cents (1000 = €10)
  job_id              uuid REFERENCES public.job_postings(id) ON DELETE SET NULL,
  metadata            jsonb DEFAULT '{}',
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),

  CONSTRAINT payments_stripe_payment_id_unique UNIQUE (stripe_payment_id)
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Users can read their own payments
CREATE POLICY "Payments: user reads own" ON public.payments
  FOR SELECT USING (user_id = auth.uid());

-- Service role / webhook inserts (SECURITY DEFINER functions handle writes)
-- No INSERT/UPDATE policy for authenticated — webhook uses service role

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_payments_user_id         ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_job_id          ON public.payments(job_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_event_id ON public.payments(stripe_event_id) WHERE stripe_event_id IS NOT NULL;

-- ============================================================
-- updated_at trigger
-- ============================================================
CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
