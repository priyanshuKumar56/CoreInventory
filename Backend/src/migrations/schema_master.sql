-- ============================================================
-- CoreInventory IMS - PostgreSQL Schema (Master)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'manager', 'staff');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE operation_status AS ENUM ('draft', 'ready', 'done', 'cancelled', 'waiting');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE move_type AS ENUM ('receipt', 'delivery', 'transfer', 'adjustment');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(150) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,
  role        user_role NOT NULL DEFAULT 'staff',
  avatar_url  VARCHAR(500),
  is_active   BOOLEAN DEFAULT true,
  last_login  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- OTP TOKENS
-- ============================================================
CREATE TABLE IF NOT EXISTS otp_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email       VARCHAR(150) NOT NULL,
  token       VARCHAR(6) NOT NULL,
  purpose     VARCHAR(50) NOT NULL DEFAULT 'password_reset',
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- REFRESH TOKENS
-- ============================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       VARCHAR(500) NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- WAREHOUSES
-- ============================================================
CREATE TABLE IF NOT EXISTS warehouses (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(150) NOT NULL,
  code        VARCHAR(10) UNIQUE NOT NULL,
  address     TEXT,
  city        VARCHAR(100),
  country     VARCHAR(100) DEFAULT 'India',
  is_active   BOOLEAN DEFAULT true,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LOCATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS locations (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         VARCHAR(150) NOT NULL,
  code         VARCHAR(20) NOT NULL,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  parent_id    UUID REFERENCES locations(id),
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(code, warehouse_id)
);

-- ============================================================
-- PRODUCT CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS product_categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             VARCHAR(200) NOT NULL,
  sku              VARCHAR(50) UNIQUE NOT NULL,
  description      TEXT,
  category_id      UUID REFERENCES product_categories(id),
  unit_of_measure  VARCHAR(30) NOT NULL DEFAULT 'pcs',
  reorder_point    NUMERIC(12,3) DEFAULT 0,
  initial_stock    NUMERIC(12,3) DEFAULT 0,
  cost_price       NUMERIC(12,2) DEFAULT 0,
  sale_price       NUMERIC(12,2) DEFAULT 0,
  barcode          VARCHAR(100),
  is_active        BOOLEAN DEFAULT true,
  created_by       UUID REFERENCES users(id),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CONTACTS (Vendors / Customers)
-- ============================================================
CREATE TABLE IF NOT EXISTS contacts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(150) UNIQUE NOT NULL,
  type        VARCHAR(20) NOT NULL DEFAULT 'vendor', -- vendor | customer | both
  email       VARCHAR(150),
  phone       VARCHAR(30),
  address     TEXT,
  gstin       VARCHAR(20),
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STOCK (Current Inventory)
-- ============================================================
CREATE TABLE IF NOT EXISTS stock (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  quantity    NUMERIC(12,3) NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, location_id)
);

-- ============================================================
-- SEQUENCE COUNTERS (for reference generation)
-- ============================================================
CREATE TABLE IF NOT EXISTS sequence_counters (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  operation    VARCHAR(10) NOT NULL, -- IN, OUT, TR, ADJ
  last_value   INTEGER NOT NULL DEFAULT 0,
  UNIQUE(warehouse_id, operation)
);

-- ============================================================
-- RECEIPTS
-- ============================================================
CREATE TABLE IF NOT EXISTS receipts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference       VARCHAR(30) UNIQUE NOT NULL,
  warehouse_id    UUID NOT NULL REFERENCES warehouses(id),
  contact_id      UUID REFERENCES contacts(id),
  destination_id  UUID REFERENCES locations(id),
  status          operation_status NOT NULL DEFAULT 'draft',
  scheduled_date  DATE,
  validated_at    TIMESTAMPTZ,
  responsible_id  UUID REFERENCES users(id),
  notes           TEXT,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RECEIPT ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS receipt_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  receipt_id  UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id),
  quantity    NUMERIC(12,3) NOT NULL,
  done_qty    NUMERIC(12,3) DEFAULT 0,
  unit_price  NUMERIC(12,2) DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DELIVERIES
-- ============================================================
CREATE TABLE IF NOT EXISTS deliveries (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference       VARCHAR(30) UNIQUE NOT NULL,
  warehouse_id    UUID NOT NULL REFERENCES warehouses(id),
  contact_id      UUID REFERENCES contacts(id),
  source_id       UUID REFERENCES locations(id),
  status          operation_status NOT NULL DEFAULT 'draft',
  scheduled_date  DATE,
  validated_at    TIMESTAMPTZ,
  responsible_id  UUID REFERENCES users(id),
  notes           TEXT,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DELIVERY ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS delivery_items (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delivery_id  UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  product_id   UUID NOT NULL REFERENCES products(id),
  quantity     NUMERIC(12,3) NOT NULL,
  done_qty     NUMERIC(12,3) DEFAULT 0,
  unit_price   NUMERIC(12,2) DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INTERNAL TRANSFERS
-- ============================================================
CREATE TABLE IF NOT EXISTS transfers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference       VARCHAR(30) UNIQUE NOT NULL,
  warehouse_id    UUID NOT NULL REFERENCES warehouses(id),
  from_location_id UUID REFERENCES locations(id),
  to_location_id   UUID REFERENCES locations(id),
  status          operation_status NOT NULL DEFAULT 'draft',
  scheduled_date  DATE,
  validated_at    TIMESTAMPTZ,
  responsible_id  UUID REFERENCES users(id),
  notes           TEXT,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRANSFER ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS transfer_items (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transfer_id  UUID NOT NULL REFERENCES transfers(id) ON DELETE CASCADE,
  product_id   UUID NOT NULL REFERENCES products(id),
  quantity     NUMERIC(12,3) NOT NULL,
  done_qty     NUMERIC(12,3) DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STOCK ADJUSTMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS adjustments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference       VARCHAR(30) UNIQUE NOT NULL,
  warehouse_id    UUID NOT NULL REFERENCES warehouses(id),
  location_id     UUID REFERENCES locations(id),
  status          operation_status NOT NULL DEFAULT 'draft',
  reason          TEXT,
  validated_at    TIMESTAMPTZ,
  responsible_id  UUID REFERENCES users(id),
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ADJUSTMENT ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS adjustment_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  adjustment_id   UUID NOT NULL REFERENCES adjustments(id) ON DELETE CASCADE,
  product_id      UUID NOT NULL REFERENCES products(id),
  location_id     UUID REFERENCES locations(id),
  theoretical_qty NUMERIC(12,3) DEFAULT 0,
  counted_qty     NUMERIC(12,3) NOT NULL,
  difference      NUMERIC(12,3) GENERATED ALWAYS AS (counted_qty - theoretical_qty) STORED,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STOCK MOVES (Ledger)
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_moves (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id      UUID NOT NULL REFERENCES products(id),
  from_location_id UUID REFERENCES locations(id),
  to_location_id   UUID REFERENCES locations(id),
  quantity        NUMERIC(12,3) NOT NULL,
  move_type       move_type NOT NULL,
  reference       VARCHAR(50),
  operation_id    UUID,
  notes           TEXT,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- REORDER RULES
-- ============================================================
CREATE TABLE IF NOT EXISTS reorder_rules (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id    UUID NOT NULL REFERENCES warehouses(id),
  min_qty         NUMERIC(12,3) NOT NULL DEFAULT 0,
  max_qty         NUMERIC(12,3) NOT NULL DEFAULT 0,
  reorder_qty     NUMERIC(12,3) NOT NULL DEFAULT 0,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_stock_product ON stock(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_location ON stock(location_id);
CREATE INDEX IF NOT EXISTS idx_stock_moves_product ON stock_moves(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_moves_created ON stock_moves(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_receipts_status ON receipts(status);
CREATE INDEX IF NOT EXISTS idx_receipts_warehouse ON receipts(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_tokens(email, purpose);

-- ============================================================
-- TRIGGERS: updated_at auto-update
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['users','warehouses','products','receipts','deliveries','transfers','adjustments'] LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS set_updated_at ON %I;
      CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    ', t, t);
  END LOOP;
END $$;

-- ============================================================
-- FUNCTION: Generate Reference Number
-- ============================================================
CREATE OR REPLACE FUNCTION generate_reference(
  p_warehouse_code VARCHAR,
  p_operation VARCHAR,
  p_warehouse_id UUID
) RETURNS VARCHAR AS $$
DECLARE
  v_next INTEGER;
  v_ref VARCHAR;
BEGIN
  INSERT INTO sequence_counters (warehouse_id, operation, last_value)
  VALUES (p_warehouse_id, p_operation, 1)
  ON CONFLICT (warehouse_id, operation)
  DO UPDATE SET last_value = sequence_counters.last_value + 1
  RETURNING last_value INTO v_next;

  v_ref := p_warehouse_code || '/' || p_operation || '/' || LPAD(v_next::TEXT, 4, '0');
  RETURN v_ref;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNCTION: Update Stock (atomic)
-- ============================================================
CREATE OR REPLACE FUNCTION update_stock(
  p_product_id UUID,
  p_location_id UUID,
  p_quantity_delta NUMERIC
) RETURNS VOID AS $$
BEGIN
  INSERT INTO stock (product_id, location_id, quantity)
  VALUES (p_product_id, p_location_id, p_quantity_delta)
  ON CONFLICT (product_id, location_id)
  DO UPDATE SET
    quantity = stock.quantity + p_quantity_delta,
    updated_at = NOW();

  IF (SELECT quantity FROM stock WHERE product_id = p_product_id AND location_id = p_location_id) < 0 THEN
    RAISE EXCEPTION 'Insufficient stock for product %', p_product_id;
  END IF;
END;
$$ LANGUAGE plpgsql;