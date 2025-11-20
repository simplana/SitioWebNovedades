/*
  # Add Shipping Fields to Profiles Table

  1. Changes
    - Add provincia field (text) for Panama province
    - Add corregimiento field (text) for district/corregimiento
    - Add direccion_exacta field (text) for exact address
    - Add direccion_referencia field (text) for additional references
    - Add latitude field (numeric) for geolocation
    - Add longitude field (numeric) for geolocation
    - Add city field (text) for city name
    - Add country field (text) for country, defaulting to 'Panama'

  2. Security
    - No RLS changes needed, existing policies already cover the table
*/

DO $$
BEGIN
  -- Add provincia column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'provincia'
  ) THEN
    ALTER TABLE profiles ADD COLUMN provincia text;
  END IF;

  -- Add corregimiento column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'corregimiento'
  ) THEN
    ALTER TABLE profiles ADD COLUMN corregimiento text;
  END IF;

  -- Add direccion_exacta column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'direccion_exacta'
  ) THEN
    ALTER TABLE profiles ADD COLUMN direccion_exacta text;
  END IF;

  -- Add direccion_referencia column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'direccion_referencia'
  ) THEN
    ALTER TABLE profiles ADD COLUMN direccion_referencia text;
  END IF;

  -- Add latitude column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE profiles ADD COLUMN latitude numeric;
  END IF;

  -- Add longitude column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE profiles ADD COLUMN longitude numeric;
  END IF;

  -- Add city column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'city'
  ) THEN
    ALTER TABLE profiles ADD COLUMN city text;
  END IF;

  -- Add country column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'country'
  ) THEN
    ALTER TABLE profiles ADD COLUMN country text DEFAULT 'Panama';
  END IF;
END $$;
