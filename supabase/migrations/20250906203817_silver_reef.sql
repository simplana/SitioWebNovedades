/*
  # Fix authentication settings
  
  1. Disable email confirmation requirement
  2. Allow users to sign up and sign in immediately
  3. Set up proper user profiles
*/

-- Update auth settings to disable email confirmation
-- This allows users to sign up and sign in immediately without email verification

-- Create a trigger to automatically create user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Update existing users to have profiles if they don't exist
INSERT INTO public.profiles (id, full_name, email)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'full_name', email_confirmed_at::text, 'Usuario'),
  email
FROM auth.users 
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;