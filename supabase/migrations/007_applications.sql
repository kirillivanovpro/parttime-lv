-- Migration: 007_applications.sql
-- Description: Create applications table for job applications from seekers
-- Created: 2026-04-14

-- =============================================================================
-- TABLE: applications
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.applications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id     uuid NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
  seeker_id  uuid NOT NULL REFERENCES public.seeker_profiles(id) ON DELETE CASCADE,
  message    text CHECK (char_length(message) <= 1000),
  status     text NOT NULL DEFAULT 'new'
               CHECK (status IN ('new', 'viewed', 'invited', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(job_id, seeker_id)
);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- SELECT: Seeker can read their own applications
CREATE POLICY "Applications: seeker reads own" ON public.applications
  FOR SELECT USING (
    seeker_id IN (SELECT id FROM public.seeker_profiles WHERE user_id = auth.uid())
  );

-- SELECT: Employer can read applications for their job postings
CREATE POLICY "Applications: employer reads own job apps" ON public.applications
  FOR SELECT USING (
    job_id IN (
      SELECT jp.id FROM public.job_postings jp
      JOIN public.employer_profiles ep ON ep.id = jp.employer_id
      WHERE ep.user_id = auth.uid()
    )
  );

-- INSERT: Seeker can create applications (only for themselves)
CREATE POLICY "Applications: seeker insert" ON public.applications
  FOR INSERT WITH CHECK (
    seeker_id IN (SELECT id FROM public.seeker_profiles WHERE user_id = auth.uid())
  );

-- UPDATE: Employer can update status on applications for their jobs
CREATE POLICY "Applications: employer update status" ON public.applications
  FOR UPDATE USING (
    job_id IN (
      SELECT jp.id FROM public.job_postings jp
      JOIN public.employer_profiles ep ON ep.id = jp.employer_id
      WHERE ep.user_id = auth.uid()
    )
  );

-- =============================================================================
-- INDEXES
-- =============================================================================
CREATE INDEX idx_applications_job_id    ON public.applications(job_id);
CREATE INDEX idx_applications_seeker_id ON public.applications(seeker_id);
CREATE INDEX idx_applications_status    ON public.applications(status);

-- =============================================================================
-- TRIGGER: auto-update updated_at
-- =============================================================================
CREATE TRIGGER applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
