/*
  MANUAL MIGRATION - Run this SQL in your Supabase SQL Editor

  This migration adds payment fields to the orders table and creates
  the payment_transactions table needed for Paguelo Fácil integration.

  Instructions:
  1. Go to your Supabase Dashboard
  2. Navigate to SQL Editor
  3. Create a new query
  4. Copy and paste this entire file
  5. Run the query
*/

-- Update orders table status constraint to include payment statuses
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'payment_pending',
    'payment_confirmed',
    'payment_failed'
  ));

-- Add payment fields to orders table
DO $$
BEGIN
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
    WHERE table_name = 'orders' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_status text DEFAULT 'pending';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_url'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_completed_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_completed_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_metadata'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_metadata jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Create index on payment_code for fast webhook lookups
CREATE INDEX IF NOT EXISTS idx_orders_payment_code ON orders(payment_code);

-- Create payment_transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders ON DELETE CASCADE NOT NULL,
  payment_code text NOT NULL,
  payment_id text,
  status text NOT NULL DEFAULT 'pending',
  amount decimal(10,2) NOT NULL,
  payment_type text,
  customer_email text,
  customer_name text,
  transaction_date date,
  transaction_time text,
  approval_reason text,
  raw_response jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes on payment_transactions for fast lookups
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_code ON payment_transactions(payment_code);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_id ON payment_transactions(payment_id);

-- Enable RLS on payment_transactions
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own payment transactions" ON payment_transactions;
DROP POLICY IF EXISTS "Users can create own payment transactions" ON payment_transactions;

-- Payment transactions policies
CREATE POLICY "Users can view own payment transactions"
  ON payment_transactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = payment_transactions.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own payment transactions"
  ON payment_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = payment_transactions.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Create paguelo_facil_credentials table for storing payment gateway credentials
CREATE TABLE IF NOT EXISTS paguelo_facil_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  environment text NOT NULL CHECK (environment IN ('sandbox', 'production')),
  store_id text NOT NULL,
  token text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(environment)
);

-- Enable RLS on paguelo_facil_credentials
ALTER TABLE paguelo_facil_credentials ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Only service role can access credentials" ON paguelo_facil_credentials;

-- Only service role can access credentials (no public access)
CREATE POLICY "Only service role can access credentials"
  ON paguelo_facil_credentials
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Insert sandbox credentials (REPLACE WITH YOUR ACTUAL CREDENTIALS)
INSERT INTO paguelo_facil_credentials (environment, store_id, token)
VALUES ('sandbox', 'YOUR_STORE_ID_HERE', 'YOUR_TOKEN_HERE')
ON CONFLICT (environment) DO UPDATE
SET store_id = EXCLUDED.store_id,
    token = EXCLUDED.token,
    updated_at = now();

-- =============================================================================
-- PRODUCT COMMENTS AND TESTIMONIALS MIGRATION
-- =============================================================================

-- Create product_comments table
CREATE TABLE IF NOT EXISTS product_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL,
  helpful_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create comment_helpful_votes table
CREATE TABLE IF NOT EXISTS comment_helpful_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES product_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Create testimonials table
CREATE TABLE IF NOT EXISTS testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  text text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE product_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_helpful_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_comments
DROP POLICY IF EXISTS "Anyone can read product comments" ON product_comments;
CREATE POLICY "Anyone can read product comments"
  ON product_comments FOR SELECT
  TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create comments" ON product_comments;
CREATE POLICY "Authenticated users can create comments"
  ON product_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own comments" ON product_comments;
CREATE POLICY "Users can update own comments"
  ON product_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON product_comments;
CREATE POLICY "Users can delete own comments"
  ON product_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for comment_helpful_votes
DROP POLICY IF EXISTS "Anyone can read helpful votes" ON comment_helpful_votes;
CREATE POLICY "Anyone can read helpful votes"
  ON comment_helpful_votes FOR SELECT
  TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create helpful votes" ON comment_helpful_votes;
CREATE POLICY "Authenticated users can create helpful votes"
  ON comment_helpful_votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own helpful votes" ON comment_helpful_votes;
CREATE POLICY "Users can delete own helpful votes"
  ON comment_helpful_votes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for testimonials
DROP POLICY IF EXISTS "Anyone can read approved testimonials" ON testimonials;
CREATE POLICY "Anyone can read approved testimonials"
  ON testimonials FOR SELECT
  TO authenticated, anon
  USING (approved = true);

DROP POLICY IF EXISTS "Users can read own testimonials" ON testimonials;
CREATE POLICY "Users can read own testimonials"
  ON testimonials FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can create testimonials" ON testimonials;
CREATE POLICY "Authenticated users can create testimonials"
  ON testimonials FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own unapproved testimonials" ON testimonials;
CREATE POLICY "Users can update own unapproved testimonials"
  ON testimonials FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND approved = false)
  WITH CHECK (auth.uid() = user_id AND approved = false);

DROP POLICY IF EXISTS "Users can delete own testimonials" ON testimonials;
CREATE POLICY "Users can delete own testimonials"
  ON testimonials FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_comments_product_id ON product_comments(product_id);
CREATE INDEX IF NOT EXISTS idx_product_comments_user_id ON product_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_helpful_votes_comment_id ON comment_helpful_votes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_helpful_votes_user_id ON comment_helpful_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_approved ON testimonials(approved);
CREATE INDEX IF NOT EXISTS idx_testimonials_user_id ON testimonials(user_id);

-- Create triggers to auto-update updated_at
DROP TRIGGER IF EXISTS update_product_comments_updated_at ON product_comments;
CREATE TRIGGER update_product_comments_updated_at BEFORE UPDATE ON product_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_testimonials_updated_at ON testimonials;
CREATE TRIGGER update_testimonials_updated_at BEFORE UPDATE ON testimonials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to update helpful_count when votes are added/removed
CREATE OR REPLACE FUNCTION update_comment_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE product_comments
    SET helpful_count = helpful_count + 1
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE product_comments
    SET helpful_count = helpful_count - 1
    WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update helpful_count
DROP TRIGGER IF EXISTS update_helpful_count_on_vote ON comment_helpful_votes;
CREATE TRIGGER update_helpful_count_on_vote
  AFTER INSERT OR DELETE ON comment_helpful_votes
  FOR EACH ROW EXECUTE FUNCTION update_comment_helpful_count();

-- All done!
SELECT 'Migration completed successfully! You can now close this window and return to your application.' as message;
