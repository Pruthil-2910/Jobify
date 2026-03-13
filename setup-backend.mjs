import { execSync } from 'child_process';

const queries = [
  "ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;",
  "CREATE POLICY \"Public profiles are viewable by everyone.\" ON profiles FOR SELECT USING (true);",
  "CREATE POLICY \"Users can insert their own profile.\" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);",
  "CREATE POLICY \"Users can update own profile.\" ON profiles FOR UPDATE USING (auth.uid() = id);",
  "ALTER TABLE jobs_cache ENABLE ROW LEVEL SECURITY;",
  "CREATE POLICY \"Jobs are viewable by everyone.\" ON jobs_cache FOR SELECT USING (true);",
  "CREATE POLICY \"Anyone can insert jobs cache\" ON jobs_cache FOR INSERT WITH CHECK (true);",
  "CREATE POLICY \"Anyone can update jobs cache\" ON jobs_cache FOR UPDATE USING (true);",
  // Function
  `CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger AS $$ BEGIN INSERT INTO public.profiles (id, email, full_name, skills) VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', '[""react"", ""typescript"", ""frontend""]'::jsonb); RETURN new; END; $$ LANGUAGE plpgsql SECURITY DEFINER;`,
  // Trigger
  `DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;`,
  `CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();`
];

for (const q of queries) {
  try {
    console.log("Executing:", q.substring(0, 80));
    // For Windows, it's safer to write to a temp file and execute? The CLI doesn't support file input.
    // Let's escape quotes for powershell correctly, or just use cross-platform escaping.
    // Just escaping double quotes is enough if we wrap in double quotes.
    const escaped = q.replace(/"/g, '\\"');
    execSync(`npx @insforge/cli db query "${escaped}"`, { stdio: 'inherit' });
  } catch (err) {
    console.error("Failed:", err.message);
  }
}
