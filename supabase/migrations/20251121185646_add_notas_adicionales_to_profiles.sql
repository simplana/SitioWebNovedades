/*
  # Add Notas Adicionales Field to Profiles Table

  1. Changes
    - Add notas_adicionales field (text) for additional delivery notes
    - This field stores special instructions or notes for delivery

  2. Security
    - No RLS changes needed, existing policies already cover the table
*/

DO $$
BEGIN
  -- Add notas_adicionales column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'notas_adicionales'
  ) THEN
    ALTER TABLE profiles ADD COLUMN notas_adicionales text;
  END IF;
END $$;
