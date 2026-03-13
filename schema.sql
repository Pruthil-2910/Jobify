CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  resume_url TEXT,
  github_url TEXT,
  linkedin_url TEXT,
  skills JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS jobs_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adzuna_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  company TEXT,
  location TEXT,
  description TEXT,
  category TEXT,
  salary_max FLOAT,
  redirect_url TEXT,
  last_synced TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert their own profile." ON profiles;
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile." ON profiles;
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE jobs_cache ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Jobs are viewable by everyone." ON jobs_cache;
CREATE POLICY "Jobs are viewable by everyone." ON jobs_cache FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert jobs cache" ON jobs_cache;
CREATE POLICY "Anyone can insert jobs cache" ON jobs_cache FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can update jobs cache" ON jobs_cache;
CREATE POLICY "Anyone can update jobs cache" ON jobs_cache FOR UPDATE USING (true);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, skills)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', '["react", "typescript", "frontend"]'::jsonb);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
