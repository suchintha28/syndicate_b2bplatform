-- ============================================================
-- Syndicate B2B Marketplace — Database Schema
-- ============================================================

-- ─── ENUMS ───────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('buyer', 'seller');
CREATE TYPE rfq_status AS ENUM ('pending', 'read', 'responded', 'closed');

-- ─── PROFILES ────────────────────────────────────────────────

CREATE TABLE profiles (
  id          uuid        PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name   text        NOT NULL,
  email       text        NOT NULL,
  role        user_role   NOT NULL,
  avatar_url  text,
  phone       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── BRANDS ──────────────────────────────────────────────────

CREATE TABLE brands (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id          uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name              text        NOT NULL,
  slug              text        NOT NULL UNIQUE,
  description       text        NOT NULL,
  logo_url          text,
  cover_image_url   text,
  website           text,
  phone             text,
  email             text,
  address           text,
  city              text,
  categories        text[]      NOT NULL DEFAULT '{}',
  is_verified       boolean     NOT NULL DEFAULT false,
  is_active         boolean     NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- ─── PRODUCTS ────────────────────────────────────────────────

CREATE TABLE products (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id            uuid        NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name                text        NOT NULL,
  slug                text        NOT NULL UNIQUE,
  description         text        NOT NULL,
  images              text[]      NOT NULL DEFAULT '{}',
  category            text        NOT NULL,
  subcategory         text,
  min_order_quantity  integer,
  price_range_min     decimal(12, 2),
  price_range_max     decimal(12, 2),
  unit                text,
  tags                text[]      NOT NULL DEFAULT '{}',
  is_active           boolean     NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- ─── RFQs ────────────────────────────────────────────────────

CREATE TABLE rfqs (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  brand_id    uuid        NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  product_id  uuid        REFERENCES products(id) ON DELETE SET NULL,
  subject     text        NOT NULL,
  message     text        NOT NULL,
  quantity    integer,
  unit        text,
  status      rfq_status  NOT NULL DEFAULT 'pending',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE rfq_responses (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id      uuid        NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
  sender_id   uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message     text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── INDEXES ─────────────────────────────────────────────────

CREATE INDEX idx_brands_owner_id   ON brands(owner_id);
CREATE INDEX idx_brands_slug       ON brands(slug);
CREATE INDEX idx_brands_is_active  ON brands(is_active);

CREATE INDEX idx_products_brand_id  ON products(brand_id);
CREATE INDEX idx_products_slug      ON products(slug);
CREATE INDEX idx_products_category  ON products(category);
CREATE INDEX idx_products_is_active ON products(is_active);

CREATE INDEX idx_rfqs_buyer_id   ON rfqs(buyer_id);
CREATE INDEX idx_rfqs_brand_id   ON rfqs(brand_id);
CREATE INDEX idx_rfqs_status     ON rfqs(status);

CREATE INDEX idx_rfq_responses_rfq_id ON rfq_responses(rfq_id);

-- ─── AUTO-UPDATE updated_at ──────────────────────────────────

CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trg_brands_updated_at
  BEFORE UPDATE ON brands
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trg_rfqs_updated_at
  BEFORE UPDATE ON rfqs
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ─── AUTO-CREATE PROFILE ON SIGN-UP ──────────────────────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'buyer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────

ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands         ENABLE ROW LEVEL SECURITY;
ALTER TABLE products       ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfqs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfq_responses  ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "profiles: anyone can read"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "profiles: owner can update"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- brands
CREATE POLICY "brands: anyone can read active brands"
  ON brands FOR SELECT USING (is_active = true);

CREATE POLICY "brands: owner can insert"
  ON brands FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "brands: owner can update"
  ON brands FOR UPDATE USING (auth.uid() = owner_id);

-- products
CREATE POLICY "products: anyone can read active products"
  ON products FOR SELECT USING (is_active = true);

CREATE POLICY "products: brand owner can insert"
  ON products FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM brands
      WHERE brands.id = products.brand_id
        AND brands.owner_id = auth.uid()
    )
  );

CREATE POLICY "products: brand owner can update"
  ON products FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM brands
      WHERE brands.id = products.brand_id
        AND brands.owner_id = auth.uid()
    )
  );

-- rfqs
CREATE POLICY "rfqs: buyer sees own rfqs"
  ON rfqs FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "rfqs: seller sees rfqs for their brands"
  ON rfqs FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM brands
      WHERE brands.id = rfqs.brand_id
        AND brands.owner_id = auth.uid()
    )
  );

CREATE POLICY "rfqs: buyer can insert"
  ON rfqs FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "rfqs: seller can update status"
  ON rfqs FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM brands
      WHERE brands.id = rfqs.brand_id
        AND brands.owner_id = auth.uid()
    )
  );

-- rfq_responses
CREATE POLICY "rfq_responses: visible to buyer and seller"
  ON rfq_responses FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM rfqs
      WHERE rfqs.id = rfq_responses.rfq_id
        AND (
          rfqs.buyer_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM brands
            WHERE brands.id = rfqs.brand_id
              AND brands.owner_id = auth.uid()
          )
        )
    )
  );

CREATE POLICY "rfq_responses: buyer or seller can insert"
  ON rfq_responses FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM rfqs
      WHERE rfqs.id = rfq_responses.rfq_id
        AND (
          rfqs.buyer_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM brands
            WHERE brands.id = rfqs.brand_id
              AND brands.owner_id = auth.uid()
          )
        )
    )
  );
