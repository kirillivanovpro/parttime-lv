-- ============================================================
-- Seeker profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.seeker_profiles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bio         text,
  skills      text[] DEFAULT '{}',
  experience_years int DEFAULT 0 CHECK (experience_years >= 0 AND experience_years <= 50),
  desired_salary   int CHECK (desired_salary > 0),
  city        text,
  schedule    text CHECK (schedule IN ('flexible', 'mornings', 'evenings', 'weekends')),
  cv_url      text,
  is_visible  bool DEFAULT true NOT NULL,
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.seeker_profiles ENABLE ROW LEVEL SECURITY;

-- Visible profiles are public; owner always sees own
CREATE POLICY "Seeker profiles: public read if visible" ON public.seeker_profiles
  FOR SELECT USING (is_visible = true OR auth.uid() = user_id);

CREATE POLICY "Seeker profiles: owner insert" ON public.seeker_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Seeker profiles: owner update" ON public.seeker_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_seeker_profiles_user_id ON public.seeker_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_seeker_profiles_city    ON public.seeker_profiles(city) WHERE is_visible = true;
CREATE INDEX IF NOT EXISTS idx_seeker_profiles_schedule ON public.seeker_profiles(schedule) WHERE is_visible = true;

-- ============================================================
-- Employer profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.employer_profiles (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name        text NOT NULL,
  company_description text,
  website             text,
  logo_url            text,
  city                text,
  updated_at          timestamptz DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.employer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employer profiles: public read" ON public.employer_profiles
  FOR SELECT USING (true);

CREATE POLICY "Employer profiles: owner insert" ON public.employer_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Employer profiles: owner update" ON public.employer_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_employer_profiles_user_id ON public.employer_profiles(user_id);

-- ============================================================
-- updated_at triggers (reuse function from migration 001)
-- ============================================================
CREATE TRIGGER seeker_profiles_updated_at
  BEFORE UPDATE ON public.seeker_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER employer_profiles_updated_at
  BEFORE UPDATE ON public.employer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- Storage buckets
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('cvs', 'cvs', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- CV bucket: private, only owner
CREATE POLICY "CVs: owner upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'cvs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "CVs: owner read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'cvs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "CVs: owner update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'cvs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "CVs: owner delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'cvs' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Logos bucket: public read, owner write
CREATE POLICY "Logos: public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'logos');

CREATE POLICY "Logos: owner upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'logos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Logos: owner update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'logos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Logos: owner delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'logos' AND (storage.foldername(name))[1] = auth.uid()::text);
