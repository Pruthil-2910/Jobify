import { execSync } from 'child_process';

const query = `
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, skills)
  VALUES (
    new.id, 
    new.email, 
    'New User', 
    '["react", "typescript", "frontend"]'::jsonb
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

try {
  console.log("Replacing trigger function...");
  const escaped = query.replace(/"/g, '\\"');
  execSync(`npx @insforge/cli db query "${escaped}"`, { stdio: 'inherit' });
  console.log("Trigger replaced successfully.");
} catch (err) {
  console.error("Failed:", err.message);
}
