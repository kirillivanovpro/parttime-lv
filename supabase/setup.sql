-- ============================================================
-- Part:time.lv — Supabase Database Setup
-- Run this in the Supabase SQL editor
-- ============================================================

-- profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text,
  full_name text,
  phone text,
  wallet_balance numeric(10,2) NOT NULL DEFAULT 0,
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- listings category enum
CREATE TYPE listing_category AS ENUM ('cleaning','delivery','it','garden','moving','other');

-- listings
CREATE TABLE IF NOT EXISTS listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category listing_category NOT NULL DEFAULT 'other',
  price numeric(10,2),
  location text,
  contact_phone text,
  contact_email text,
  is_paid boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  view_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- contact_unlocks
CREATE TABLE IF NOT EXISTS contact_unlocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES listings ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, listing_id)
);

-- payments
CREATE TABLE IF NOT EXISTS payments (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  provider text NOT NULL,
  provider_ref text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- RPC Functions
-- ============================================================

CREATE OR REPLACE FUNCTION complete_balance_topup(p_user_id uuid, p_amount numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE profiles SET wallet_balance = wallet_balance + p_amount WHERE id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION deduct_balance(p_user_id uuid, p_amount numeric, p_type text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_balance numeric;
BEGIN
  SELECT wallet_balance INTO v_balance FROM profiles WHERE id = p_user_id FOR UPDATE;
  IF v_balance IS NULL THEN RETURN jsonb_build_object('error', 'Profile not found'); END IF;
  IF v_balance < p_amount THEN RETURN jsonb_build_object('error', 'Insufficient balance'); END IF;
  UPDATE profiles SET wallet_balance = wallet_balance - p_amount WHERE id = p_user_id;
  RETURN jsonb_build_object('ok', true);
END;
$$;

-- ============================================================
-- Auto-create profile on user signup
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- profiles: users can read/update their own profile
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- listings: anyone can read active+paid listings (without contact columns)
CREATE POLICY "listings_select_public" ON listings FOR SELECT
  USING (is_active = true AND is_paid = true);
CREATE POLICY "listings_insert_own" ON listings FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "listings_update_own" ON listings FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "listings_delete_own" ON listings FOR DELETE
  USING (auth.uid() = user_id);

-- contact_unlocks: users can read their own unlocks
CREATE POLICY "unlocks_select_own" ON contact_unlocks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "unlocks_insert_own" ON contact_unlocks FOR INSERT WITH CHECK (auth.uid() = user_id);

-- payments: users can read their own payments
CREATE POLICY "payments_select_own" ON payments FOR SELECT USING (auth.uid() = user_id);
