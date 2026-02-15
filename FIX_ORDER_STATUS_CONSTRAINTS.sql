/*
  # Fix order status and payment_status constraints

  INSTRUCCIONES:
  1. Ve a tu Supabase Dashboard
  2. Abre el SQL Editor
  3. Copia y pega este SQL completo
  4. Ejecuta la consulta

  CAMBIOS:
    - Agrega payment_status column si no existe
    - Agrega columnas relacionadas con pagos (payment_method, payment_code, payment_id, payment_url)
    - Actualiza constraint de status para incluir estados de pago: 'payment_pending', 'payment_confirmed', 'payment_failed'
    - Agrega constraint de payment_status con valores correctos: 'pending', 'processing', 'shipped', 'delivered', 'cancelled'
    - Remueve constraints antiguos incorrectos

  NOTAS:
    - payment_status rastrea el estado de entrega/envío
    - status rastrea el estado general de la orden incluyendo estados de pago
    - Esta migración es idempotente y puede ejecutarse múltiples veces de forma segura
*/

-- Add payment_status column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_status text;
  END IF;
END $$;

-- Add payment_method column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_method text;
  END IF;
END $$;

-- Add payment_code column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_code'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_code text;
  END IF;
END $$;

-- Add payment_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_id text;
  END IF;
END $$;

-- Add payment_url column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_url'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_url text;
  END IF;
END $$;

-- Add order_number column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'order_number'
  ) THEN
    ALTER TABLE orders ADD COLUMN order_number text UNIQUE;
  END IF;
END $$;

-- Drop old status constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'orders' AND constraint_name = 'orders_status_check'
  ) THEN
    ALTER TABLE orders DROP CONSTRAINT orders_status_check;
  END IF;
END $$;

-- Add new status constraint with payment states
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled',
                    'payment_pending', 'payment_confirmed', 'payment_failed'));

-- Drop old payment_status constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'orders' AND constraint_name = 'orders_payment_status_check'
  ) THEN
    ALTER TABLE orders DROP CONSTRAINT orders_payment_status_check;
  END IF;
END $$;

-- Add correct payment_status constraint (for shipping/delivery status)
ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check
  CHECK (payment_status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled') OR payment_status IS NULL);

-- Create index on payment_status for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

-- Create index on order_number for better lookup performance
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- Verify the changes
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'orders'
  AND column_name IN ('status', 'payment_status', 'payment_method', 'payment_code', 'payment_id', 'payment_url', 'order_number')
ORDER BY column_name;
