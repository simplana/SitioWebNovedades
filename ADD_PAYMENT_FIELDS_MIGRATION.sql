/*
  # Agregar campos de pago a la tabla orders

  1. Nuevos Campos
    - `order_number` (text) - Número de orden único (formato: NC-timestamp)
    - `payment_method` (text) - Método de pago: transfer, paguelo_facil, cash
    - `payment_code` (text) - Código de transacción de Paguelo Fácil
    - `payment_id` (text) - ID de pago de Paguelo Fácil
    - `payment_url` (text) - URL de pago de Paguelo Fácil
    - `payment_status` (text) - Estado del pago: pending, completed, failed, cancelled

  2. Modificaciones
    - Agregar estos campos a la tabla orders existente
    - Crear índice en order_number para búsquedas rápidas

  3. Notas Importantes
    - Los campos son opcionales (nullable) para mantener compatibilidad con órdenes existentes
    - payment_status es independiente del status general de la orden

  INSTRUCCIONES:
  Ejecuta este SQL en tu dashboard de Supabase (SQL Editor) para agregar los campos necesarios.
*/

-- Agregar campos de pago a la tabla orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'order_number'
  ) THEN
    ALTER TABLE orders ADD COLUMN order_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_method text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_code'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_code text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_url'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_status text;
  END IF;
END $$;

-- Crear índice en order_number para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- Agregar constraint para validar payment_status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'orders_payment_status_check'
  ) THEN
    ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check
    CHECK (payment_status IN ('pending', 'completed', 'failed', 'cancelled') OR payment_status IS NULL);
  END IF;
END $$;

-- Agregar constraint para validar payment_method
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'orders_payment_method_check'
  ) THEN
    ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check
    CHECK (payment_method IN ('transfer', 'paguelo_facil', 'cash') OR payment_method IS NULL);
  END IF;
END $$;
