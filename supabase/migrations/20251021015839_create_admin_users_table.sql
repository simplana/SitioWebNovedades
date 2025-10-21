/*
  # Create admin_users table

  1. New Tables
    - `admin_users`
      - `id` (uuid, primary key)
      - `email` (text, unique) - Email del usuario administrador
      - `created_at` (timestamptz) - Fecha de creación
      - `created_by` (uuid) - Usuario que creó este admin (opcional)
  
  2. Security
    - Enable RLS on `admin_users` table
    - Only authenticated users can read from this table
    - No one can insert/update/delete through the client (debe hacerse desde SQL o backend)
  
  3. Initial Data
    - Insert gerard.gaspar.crespo@gmail.com as the first admin
*/

CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read admin emails"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (true);

INSERT INTO admin_users (email) 
VALUES ('gerard.gaspar.crespo@gmail.com')
ON CONFLICT (email) DO NOTHING;