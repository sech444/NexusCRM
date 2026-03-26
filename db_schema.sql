-- ============================================================
-- NexusCRM — PostgreSQL Database Schema
-- Compatible with: PostgreSQL 14+
-- ORM target:      Prisma 5 (or raw queries)
-- ============================================================

-- ─── Extensions ───────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- fuzzy search on names

-- ─── Roles / Permissions ──────────────────────────────────
-- roles are an enum; adding a new role = ALTER TYPE
-- to keep it flexible, a JSON permissions column lets you
-- override per-user without a separate junction table.
CREATE TYPE user_role AS ENUM ('admin', 'sales', 'warehouse');

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(120)  NOT NULL,
  email         VARCHAR(255)  NOT NULL UNIQUE,
  password_hash TEXT          NOT NULL,         -- bcrypt, cost 12
  role          user_role     NOT NULL DEFAULT 'sales',
  department    VARCHAR(80),
  permissions   JSONB         NOT NULL DEFAULT '{}',  -- future overrides
  active        BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Index for login lookups
CREATE INDEX idx_users_email ON users (email);

-- ─── Products / Inventory ─────────────────────────────────
CREATE TABLE products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku           VARCHAR(30)   NOT NULL UNIQUE,
  name          VARCHAR(255)  NOT NULL,
  category      VARCHAR(80),
  unit_price    NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
  qty_in_stock  INTEGER       NOT NULL DEFAULT 0 CHECK (qty_in_stock >= 0),
  min_qty       INTEGER       NOT NULL DEFAULT 5  CHECK (min_qty >= 0),
  barcode       VARCHAR(60)   UNIQUE,
  notes         TEXT,
  active        BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Full-text / trigram search on product name
CREATE INDEX idx_products_name_trgm ON products USING GIN (name gin_trgm_ops);
CREATE INDEX idx_products_barcode   ON products (barcode);

-- Audit trail for every stock change
CREATE TYPE stock_adj_reason AS ENUM (
  'manual', 'barcode_scan', 'sale', 'purchase', 'return', 'write_off', 'import'
);

CREATE TABLE stock_adjustments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID            NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  user_id     UUID            NOT NULL REFERENCES users    (id),
  qty_before  INTEGER         NOT NULL,
  qty_change  INTEGER         NOT NULL,    -- positive = add, negative = remove
  qty_after   INTEGER         NOT NULL,
  reason      stock_adj_reason NOT NULL DEFAULT 'manual',
  notes       TEXT,
  created_at  TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX idx_stock_adj_product ON stock_adjustments (product_id, created_at DESC);

-- ─── Deals / Sales Pipeline ───────────────────────────────
CREATE TYPE deal_stage AS ENUM (
  'Lead', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'
);

CREATE TABLE deals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       VARCHAR(255)  NOT NULL,
  value       NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (value >= 0),
  stage       deal_stage    NOT NULL DEFAULT 'Lead',
  rep_id      UUID          NOT NULL REFERENCES users (id),
  product     VARCHAR(120),
  notes       TEXT,
  expected_close_date DATE,
  closed_at   TIMESTAMPTZ,            -- set when stage = Won or Lost
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_deals_rep   ON deals (rep_id, stage);
CREATE INDEX idx_deals_stage ON deals (stage);

-- Pipeline stage change history
CREATE TABLE deal_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id     UUID          NOT NULL REFERENCES deals (id) ON DELETE CASCADE,
  user_id     UUID          NOT NULL REFERENCES users (id),
  stage_from  deal_stage,
  stage_to    deal_stage    NOT NULL,
  notes       TEXT,
  changed_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- ─── Customers ────────────────────────────────────────────
CREATE TABLE customers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255)  NOT NULL,
  email       VARCHAR(255),
  phone       VARCHAR(40),
  address     TEXT,
  tax_id      VARCHAR(60),             -- VAT / EIN for invoice compliance
  notes       TEXT,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_customers_email ON customers (email);
CREATE INDEX idx_customers_name_trgm ON customers USING GIN (name gin_trgm_ops);

-- ─── Invoices ─────────────────────────────────────────────
CREATE TYPE invoice_status AS ENUM ('draft', 'pending', 'paid', 'overdue', 'voided');

CREATE TABLE invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number  VARCHAR(20)   NOT NULL UNIQUE,   -- INV-0001
  customer_id     UUID          NOT NULL REFERENCES customers (id),
  created_by      UUID          NOT NULL REFERENCES users (id),
  invoice_date    DATE          NOT NULL DEFAULT CURRENT_DATE,
  due_date        DATE          NOT NULL,
  status          invoice_status NOT NULL DEFAULT 'pending',
  tax_rate        NUMERIC(5,2)  NOT NULL DEFAULT 10.00 CHECK (tax_rate >= 0 AND tax_rate <= 100),
  notes           TEXT,
  paid_at         TIMESTAMPTZ,
  voided_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Auto-incrementing invoice number sequence
CREATE SEQUENCE invoice_seq START 1;

CREATE OR REPLACE FUNCTION next_invoice_number()
RETURNS TEXT LANGUAGE plpgsql AS $$
BEGIN
  RETURN 'INV-' || LPAD(nextval('invoice_seq')::TEXT, 4, '0');
END;
$$;

-- Use it as the default:
ALTER TABLE invoices
  ALTER COLUMN invoice_number SET DEFAULT next_invoice_number();

CREATE INDEX idx_invoices_customer ON invoices (customer_id);
CREATE INDEX idx_invoices_status   ON invoices (status, due_date);

CREATE TABLE invoice_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id  UUID            NOT NULL REFERENCES invoices (id) ON DELETE CASCADE,
  description VARCHAR(255)    NOT NULL,
  qty         NUMERIC(10,2)   NOT NULL DEFAULT 1 CHECK (qty > 0),
  unit_price  NUMERIC(12,2)   NOT NULL CHECK (unit_price >= 0),
  -- Computed columns (Postgres 12+ generated column):
  line_total  NUMERIC(14,2)   GENERATED ALWAYS AS (qty * unit_price) STORED,
  sort_order  SMALLINT        NOT NULL DEFAULT 0
);

-- ─── Invoice → Deal link (optional) ──────────────────────
ALTER TABLE invoices ADD COLUMN deal_id UUID REFERENCES deals (id) ON DELETE SET NULL;

-- ─── Computed views ────────────────────────────────────────
-- Handy view: invoice totals (subquery-free in app layer)
CREATE OR REPLACE VIEW invoice_totals AS
SELECT
  i.id,
  i.invoice_number,
  i.status,
  i.due_date,
  c.name                                    AS customer_name,
  c.email                                   AS customer_email,
  SUM(ii.line_total)                        AS subtotal,
  SUM(ii.line_total) * i.tax_rate / 100     AS tax_amount,
  SUM(ii.line_total) * (1 + i.tax_rate/100) AS total_amount
FROM invoices i
JOIN customers   c  ON c.id = i.customer_id
JOIN invoice_items ii ON ii.invoice_id = i.id
GROUP BY i.id, c.name, c.email;

-- Low-stock alert view
CREATE OR REPLACE VIEW low_stock_products AS
SELECT * FROM products
WHERE qty_in_stock <= min_qty AND active = TRUE
ORDER BY (qty_in_stock::FLOAT / NULLIF(min_qty, 0)) ASC;

-- Pipeline summary view
CREATE OR REPLACE VIEW pipeline_summary AS
SELECT
  stage,
  COUNT(*)                    AS deal_count,
  SUM(value)                  AS total_value,
  AVG(value)                  AS avg_value,
  u.name                      AS rep_name,
  u.id                        AS rep_id
FROM deals d
JOIN users u ON u.id = d.rep_id
WHERE stage NOT IN ('Won', 'Lost')
GROUP BY stage, u.id, u.name;

-- ─── Triggers: updated_at auto-bump ───────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['users','products','deals','customers','invoices'] LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%I_updated BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
      t, t
    );
  END LOOP;
END;
$$;

-- ─── Row-Level Security (Optional, Supabase-style) ────────
-- Enable only if you expose Postgres directly (e.g. via Supabase)
-- ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY sales_own_deals ON deals
--   FOR ALL USING (rep_id = current_setting('app.current_user_id')::UUID);

-- ─── Seed: demo data ──────────────────────────────────────
-- Passwords are bcrypt hashes of the plain-text values shown.
-- admin123 / sales123 / warehouse123 — change before production.

INSERT INTO users (name, email, password_hash, role, department) VALUES
  ('Alex Morgan',  'admin@crm.com',     '$2b$12$PLACEHOLDER_ADMIN_HASH',     'admin',     'Management'),
  ('Sarah Chen',   'sarah@crm.com',     '$2b$12$PLACEHOLDER_SALES_HASH',     'sales',     'Sales'),
  ('Mike Torres',  'mike@crm.com',      '$2b$12$PLACEHOLDER_WAREHOUSE_HASH', 'warehouse', 'Operations');

-- To generate real hashes:
-- node -e "const b=require('bcrypt'); b.hash('admin123',12).then(console.log)"
