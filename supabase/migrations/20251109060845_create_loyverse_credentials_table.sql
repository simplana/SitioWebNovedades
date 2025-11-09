/*
  # Create loyverse_credentials table

  1. New Tables
    - `loyverse_credentials`
      - `id` (uuid, primary key)
      - `connection_id` (text, unique) - ID único de la conexión
      - `access_token` (text) - Token de acceso de Loyverse
      - `refresh_token` (text) - Token para renovar el acceso
      - `token_expiry` (timestamptz) - Fecha de expiración del token
      - `is_active` (boolean) - Si esta conexión está activa
      - `last_refreshed_at` (timestamptz) - Última vez que se renovó el token
      - `created_at` (timestamptz) - Fecha de creación
      - `updated_at` (timestamptz) - Fecha de actualización
  
  2. Security
    - Enable RLS on `loyverse_credentials` table
    - Authenticated users can read credentials (needed for client-side API calls)
    - No direct insert/update/delete from client (handled by Edge Functions)
  
  3. Notes
    - Only one active connection allowed at a time
    - Tokens auto-refresh when expiring within 24 hours
*/

CREATE TABLE IF NOT EXISTS loyverse_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id text UNIQUE NOT NULL,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  token_expiry timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  last_refreshed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE loyverse_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read credentials"
  ON loyverse_credentials
  FOR SELECT
  TO authenticated
  USING (true);