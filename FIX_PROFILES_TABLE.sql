/*
  # Fix Profiles Table Structure

  Este script corrige el problema de la tabla profiles y asegura que tenga
  todos los campos necesarios para el envío con Servientrega.

  INSTRUCCIONES:
  1. Ve a tu Supabase Dashboard: https://iabrhkvwhmliemgioxce.supabase.co
  2. Ve a SQL Editor
  3. Crea un nuevo query
  4. Copia y pega TODO este contenido
  5. Click en "Run" para ejecutarlo
*/

-- Step 1: Renombrar user_profiles a profiles si es necesario
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles' AND table_schema = 'public')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
    ALTER TABLE user_profiles RENAME TO profiles;
    RAISE NOTICE 'Tabla user_profiles renombrada a profiles';
  END IF;
END $$;

-- Step 2: Crear tabla profiles si no existe
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name text,
  phone text,
  address text,
  city text,
  country text DEFAULT 'Panamá',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Step 3: Agregar todos los campos necesarios para envío
DO $$
BEGIN
  -- provincia
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'provincia' AND table_schema = 'public'
  ) THEN
    ALTER TABLE profiles ADD COLUMN provincia text;
    RAISE NOTICE 'Campo provincia agregado';
  END IF;

  -- corregimiento
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'corregimiento' AND table_schema = 'public'
  ) THEN
    ALTER TABLE profiles ADD COLUMN corregimiento text;
    RAISE NOTICE 'Campo corregimiento agregado';
  END IF;

  -- direccion_exacta
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'direccion_exacta' AND table_schema = 'public'
  ) THEN
    ALTER TABLE profiles ADD COLUMN direccion_exacta text;
    RAISE NOTICE 'Campo direccion_exacta agregado';
  END IF;

  -- direccion_referencia
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'direccion_referencia' AND table_schema = 'public'
  ) THEN
    ALTER TABLE profiles ADD COLUMN direccion_referencia text;
    RAISE NOTICE 'Campo direccion_referencia agregado';
  END IF;

  -- casa_edificio
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'casa_edificio' AND table_schema = 'public'
  ) THEN
    ALTER TABLE profiles ADD COLUMN casa_edificio text;
    RAISE NOTICE 'Campo casa_edificio agregado';
  END IF;

  -- latitude
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'latitude' AND table_schema = 'public'
  ) THEN
    ALTER TABLE profiles ADD COLUMN latitude numeric;
    RAISE NOTICE 'Campo latitude agregado';
  END IF;

  -- longitude
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'longitude' AND table_schema = 'public'
  ) THEN
    ALTER TABLE profiles ADD COLUMN longitude numeric;
    RAISE NOTICE 'Campo longitude agregado';
  END IF;

  -- notas_adicionales
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'notas_adicionales' AND table_schema = 'public'
  ) THEN
    ALTER TABLE profiles ADD COLUMN notas_adicionales text;
    RAISE NOTICE 'Campo notas_adicionales agregado';
  END IF;
END $$;

-- Step 4: Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 5: Eliminar políticas antiguas si existen
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Step 6: Crear políticas de seguridad
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Step 7: Crear índice
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- Step 8: Crear función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 9: Crear trigger
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 10: Verificar resultado
SELECT
  'profiles' as table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;
