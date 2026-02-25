# Database Migration Instructions

## Problem Summary

The `orders` table is missing several columns that the application code expects:
- Payment fields (`order_number`, `payment_method`, `payment_code`, `payment_id`, `payment_url`, `payment_status`)
- Shipping fields (`shipping_cost`, `shipping_details`, `shipping_description`)
- Servientrega guide fields (`guia_number`, `guia_pdf_url`, `guia_created_at`, `guia_created_by`)

Additionally, the `servientrega_credentials` table needs to be created.

## How to Apply the Migration

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file `APPLY_MISSING_ORDER_FIELDS.sql` from this project
4. Copy the entire SQL content
5. Paste it into the SQL Editor
6. Click **Run** to execute the migration

### Option 2: Using Supabase CLI (If Available)

If you have the Supabase CLI installed locally:

```bash
supabase db push
```

This will apply all migrations in the `supabase/migrations/` folder.

## What This Migration Does

### Adds Missing Columns to `orders` Table

All columns are added with `IF NOT EXISTS` checks, so it's safe to run multiple times:

**Payment Fields:**
- `order_number` - Unique identifier (NC-timestamp format)
- `payment_method` - transfer | paguelo_facil | cash
- `payment_code` - Páguelo Fácil transaction code
- `payment_id` - Páguelo Fácil payment ID
- `payment_url` - Páguelo Fácil checkout URL
- `payment_status` - pending | processing | completed | failed | cancelled

**Shipping Fields:**
- `shipping_cost` - Decimal field for shipping cost
- `shipping_details` - JSONB field for Servientrega API response
- `shipping_description` - Human-readable shipping info

**Servientrega Guide Fields:**
- `guia_number` - Servientrega tracking number
- `guia_pdf_url` - URL to PDF guide
- `guia_created_at` - Timestamp
- `guia_created_by` - Reference to admin user

### Creates `servientrega_credentials` Table

Stores Servientrega API credentials with RLS policies ensuring only admin users can access.

### Adds Indexes and Constraints

- Fast lookups on `order_number` and `guia_number`
- Validation constraints on payment_status and payment_method
- Unique constraint ensuring only one active Servientrega credential set

### Refreshes Schema Cache

The migration ends with `NOTIFY pgrst, 'reload schema';` to ensure PostgREST picks up the changes immediately.

## Verification

After running the migration, verify it worked:

```sql
-- Check that all columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- Check that servientrega_credentials table exists
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'servientrega_credentials';
```

## Post-Migration Steps

1. The schema cache should reload automatically
2. Your application should now work without the "shipping_description column not found" error
3. All checkout flows with Páguelo Fácil and Servientrega should function correctly

## Rollback (If Needed)

If you need to rollback, you can drop the columns and table:

```sql
-- ⚠️ WARNING: This will delete data! Only use if absolutely necessary

ALTER TABLE orders DROP COLUMN IF EXISTS order_number;
ALTER TABLE orders DROP COLUMN IF EXISTS payment_method;
ALTER TABLE orders DROP COLUMN IF EXISTS payment_code;
ALTER TABLE orders DROP COLUMN IF EXISTS payment_id;
ALTER TABLE orders DROP COLUMN IF EXISTS payment_url;
ALTER TABLE orders DROP COLUMN IF EXISTS payment_status;
ALTER TABLE orders DROP COLUMN IF EXISTS shipping_cost;
ALTER TABLE orders DROP COLUMN IF EXISTS shipping_details;
ALTER TABLE orders DROP COLUMN IF EXISTS shipping_description;
ALTER TABLE orders DROP COLUMN IF EXISTS guia_number;
ALTER TABLE orders DROP COLUMN IF EXISTS guia_pdf_url;
ALTER TABLE orders DROP COLUMN IF EXISTS guia_created_at;
ALTER TABLE orders DROP COLUMN IF EXISTS guia_created_by;

DROP TABLE IF EXISTS servientrega_credentials CASCADE;
```

## Files to Clean Up After Migration

Once the migration is successfully applied, you can delete these temporary files from the project root:

- `ADD_PAYMENT_FIELDS_MIGRATION.sql`
- `ADD_SHIPPING_TO_ORDERS.sql`
- `ADD_SERVIENTREGA_GUIDE_FIELDS.sql`
- `APPLY_MISSING_ORDER_FIELDS.sql` (this migration file)
- `MIGRATION_INSTRUCTIONS.md` (this file)

These were standalone SQL files that should have been proper migrations but weren't applied through the normal migration process.