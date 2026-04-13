-- ============================================================
-- job_postings table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.job_postings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id   uuid NOT NULL REFERENCES public.employer_profiles(id) ON DELETE CASCADE,
  title         text NOT NULL,
  description   text NOT NULL,
  category      text CHECK (category IN ('retail','hospitality','warehouse','office','other')),
  city          text NOT NULL,
  salary_min    int  CHECK (salary_min > 0),
  salary_max    int  CHECK (salary_max > 0),
  schedule      text CHECK (schedule IN ('mornings','evenings','weekends','flexible','shifts')),
  hours_per_week int CHECK (hours_per_week > 0 AND hours_per_week <= 40),
  status        text NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft','active','paused','closed')),
  views         int  NOT NULL DEFAULT 0,
  is_paid       bool NOT NULL DEFAULT false,
  expires_at    timestamptz,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  -- salary range sanity check
  CONSTRAINT salary_range_check
    CHECK (salary_max IS NULL OR salary_min IS NULL OR salary_max >= salary_min)
);

ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;

-- Active jobs visible to everyone; employer always sees own jobs
CREATE POLICY "Jobs: public active + owner all" ON public.job_postings
  FOR SELECT USING (
    status = 'active'
    OR employer_id IN (
      SELECT id FROM public.employer_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Jobs: employer insert" ON public.job_postings
  FOR INSERT WITH CHECK (
    employer_id IN (
      SELECT id FROM public.employer_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Jobs: employer update" ON public.job_postings
  FOR UPDATE USING (
    employer_id IN (
      SELECT id FROM public.employer_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Jobs: employer delete" ON public.job_postings
  FOR DELETE USING (
    employer_id IN (
      SELECT id FROM public.employer_profiles WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_job_postings_employer_id  ON public.job_postings(employer_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_status       ON public.job_postings(status);
CREATE INDEX IF NOT EXISTS idx_job_postings_city         ON public.job_postings(city)       WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_job_postings_schedule     ON public.job_postings(schedule)   WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_job_postings_salary_min   ON public.job_postings(salary_min) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_job_postings_created_at   ON public.job_postings(created_at DESC) WHERE status = 'active';

-- ============================================================
-- updated_at trigger
-- ============================================================
CREATE TRIGGER job_postings_updated_at
  BEFORE UPDATE ON public.job_postings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- RPC: increment views without auth (SECURITY DEFINER bypasses RLS)
-- ============================================================
CREATE OR REPLACE FUNCTION public.increment_job_views(job_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.job_postings
  SET views = views + 1
  WHERE id = job_id AND status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.increment_job_views(uuid) TO anon, authenticated;
