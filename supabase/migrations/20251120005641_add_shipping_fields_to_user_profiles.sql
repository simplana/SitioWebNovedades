/*
  # Add shipping fields to user_profiles

  1. Changes
    - Add `provincia` field for province
    - Add `corregimiento` field for corregimiento
    - Add `direccion_exacta` field for exact address
    - Add `latitude` and `longitude` for map coordinates
    - Add `direccion_referencia` for address reference/instructions
  
  2. Notes
    - Existing `address` field is kept for backward compatibility
    - New fields provide more structured shipping information
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'provincia'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN provincia text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'corregimiento'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN corregimiento text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'direccion_exacta'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN direccion_exacta text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN latitude double precision;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN longitude double precision;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'direccion_referencia'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN direccion_referencia text;
  END IF;
END $$;
