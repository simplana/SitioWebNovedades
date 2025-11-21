/*
  # Add Casa/Edificio Field to Profiles Table

  1. Changes
    - Add casa_edificio field (text) for house/building identification
    - This separates the building identifier from the apartment/floor reference

  2. Security
    - No RLS changes needed, existing policies already cover the table
*/

DO $$
BEGIN
  -- Add casa_edificio column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'casa_edificio'
  ) THEN
    ALTER TABLE profiles ADD COLUMN casa_edificio text;
  END IF;
END $$;
