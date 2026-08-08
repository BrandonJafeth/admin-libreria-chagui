-- ============================================================
-- Migration: discounts, bundles (paquetes), gift items (regalías)
-- Ya corrida en producción vía SQL Editor — este archivo la deja
-- versionada en el repo para que un ambiente nuevo la reciba también.
-- Idempotente: se puede correr más de una vez sin error.
-- ============================================================

BEGIN;

-- 1. DESCUENTOS en products ------------------------------------------------
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS tipo                 text        NOT NULL DEFAULT 'simple',
  ADD COLUMN IF NOT EXISTS descuento_tipo       text        NULL,
  ADD COLUMN IF NOT EXISTS precio_oferta        numeric     NULL,
  ADD COLUMN IF NOT EXISTS descuento_porcentaje numeric     NULL,
  ADD COLUMN IF NOT EXISTS descuento_activo     boolean     NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS descuento_inicio     timestamptz NULL,
  ADD COLUMN IF NOT EXISTS descuento_fin        timestamptz NULL;

ALTER TABLE products DROP CONSTRAINT IF EXISTS chk_products_tipo;
ALTER TABLE products ADD CONSTRAINT chk_products_tipo
      CHECK (tipo IN ('simple', 'paquete'));

ALTER TABLE products DROP CONSTRAINT IF EXISTS chk_products_descuento_tipo;
ALTER TABLE products ADD CONSTRAINT chk_products_descuento_tipo
      CHECK (descuento_tipo IN ('precio_fijo', 'porcentaje') OR descuento_tipo IS NULL);

ALTER TABLE products DROP CONSTRAINT IF EXISTS chk_descuento_precio_fijo;
ALTER TABLE products ADD CONSTRAINT chk_descuento_precio_fijo
      CHECK (descuento_tipo IS DISTINCT FROM 'precio_fijo'
             OR (precio_oferta IS NOT NULL AND precio_oferta > 0 AND precio_oferta < precio));

ALTER TABLE products DROP CONSTRAINT IF EXISTS chk_descuento_porcentaje;
ALTER TABLE products ADD CONSTRAINT chk_descuento_porcentaje
      CHECK (descuento_tipo IS DISTINCT FROM 'porcentaje'
             OR (descuento_porcentaje IS NOT NULL AND descuento_porcentaje > 0 AND descuento_porcentaje <= 100));

ALTER TABLE products DROP CONSTRAINT IF EXISTS chk_descuento_fechas;
ALTER TABLE products ADD CONSTRAINT chk_descuento_fechas
      CHECK (descuento_inicio IS NULL OR descuento_fin IS NULL OR descuento_fin > descuento_inicio);

CREATE OR REPLACE FUNCTION precio_final(p products)
RETURNS numeric
LANGUAGE sql
STABLE
AS $$
  SELECT CASE
    WHEN p.descuento_tipo IS NULL OR NOT p.descuento_activo THEN p.precio
    WHEN p.descuento_inicio IS NOT NULL AND now() < p.descuento_inicio THEN p.precio
    WHEN p.descuento_fin    IS NOT NULL AND now() > p.descuento_fin    THEN p.precio
    WHEN p.descuento_tipo = 'precio_fijo' THEN p.precio_oferta
    WHEN p.descuento_tipo = 'porcentaje'  THEN round(p.precio * (1 - p.descuento_porcentaje / 100), 2)
    ELSE p.precio
  END;
$$;

CREATE OR REPLACE VIEW products_con_precio AS
SELECT p.*,
       precio_final(p)              AS precio_final,
       (precio_final(p) < p.precio) AS en_oferta
FROM products p;

-- 2. PAQUETES (bundles) -----------------------------------------------------
CREATE TABLE IF NOT EXISTS product_bundle_items (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  paquete_id  uuid        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  producto_id uuid        NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  cantidad    integer     NOT NULL DEFAULT 1 CHECK (cantidad > 0),
  orden       integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (paquete_id, producto_id),
  CHECK (paquete_id <> producto_id)
);

CREATE OR REPLACE FUNCTION chk_bundle_item_tipos()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (SELECT tipo FROM products WHERE id = NEW.paquete_id) <> 'paquete' THEN
    RAISE EXCEPTION 'paquete_id % no es un producto tipo paquete', NEW.paquete_id;
  END IF;
  IF (SELECT tipo FROM products WHERE id = NEW.producto_id) = 'paquete' THEN
    RAISE EXCEPTION 'no se permiten paquetes anidados (producto_id %)', NEW.producto_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bundle_item_tipos ON product_bundle_items;
CREATE TRIGGER trg_bundle_item_tipos
  BEFORE INSERT OR UPDATE ON product_bundle_items
  FOR EACH ROW EXECUTE FUNCTION chk_bundle_item_tipos();

-- 3. REGALÍAS -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_gifts (
  id                     uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_disparador_id uuid        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  producto_regalo_id     uuid        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  cantidad_regalo        integer     NOT NULL DEFAULT 1 CHECK (cantidad_regalo > 0),
  mensaje                text        NOT NULL,
  activo                 boolean     NOT NULL DEFAULT true,
  fecha_inicio           timestamptz NULL,
  fecha_fin              timestamptz NULL,
  created_at             timestamptz NOT NULL DEFAULT now(),
  UNIQUE (producto_disparador_id, producto_regalo_id),
  CHECK (producto_disparador_id <> producto_regalo_id),
  CHECK (fecha_inicio IS NULL OR fecha_fin IS NULL OR fecha_fin > fecha_inicio)
);

-- 4. order_items — rastro de descuentos / paquetes / regalos ---------------
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS tipo_item          text    NOT NULL DEFAULT 'producto',
  ADD COLUMN IF NOT EXISTS es_regalo          boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS precio_original    numeric NULL,
  ADD COLUMN IF NOT EXISTS descuento_aplicado numeric NULL,
  ADD COLUMN IF NOT EXISTS item_padre_id      uuid    NULL REFERENCES order_items(id) ON DELETE CASCADE;

ALTER TABLE order_items DROP CONSTRAINT IF EXISTS chk_order_items_tipo_item;
ALTER TABLE order_items ADD CONSTRAINT chk_order_items_tipo_item
      CHECK (tipo_item IN ('producto', 'paquete', 'regalo'));

CREATE TABLE IF NOT EXISTS order_item_componentes (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id   uuid        NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  producto_id     uuid        NULL REFERENCES products(id) ON DELETE SET NULL,
  nombre_snapshot text        NOT NULL,
  cantidad        integer     NOT NULL CHECK (cantidad > 0),
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- 5. RLS (mismo patrón: público lee, admin escribe) --------------------------
ALTER TABLE product_bundle_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_gifts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item_componentes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read bundle items" ON product_bundle_items;
CREATE POLICY "public read bundle items" ON product_bundle_items
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "admin write bundle items" ON product_bundle_items;
CREATE POLICY "admin write bundle items" ON product_bundle_items
  FOR ALL USING (public.get_my_role() = 'admin') WITH CHECK (public.get_my_role() = 'admin');

DROP POLICY IF EXISTS "public read gifts" ON product_gifts;
CREATE POLICY "public read gifts" ON product_gifts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "admin write gifts" ON product_gifts;
CREATE POLICY "admin write gifts" ON product_gifts
  FOR ALL USING (public.get_my_role() = 'admin') WITH CHECK (public.get_my_role() = 'admin');

DROP POLICY IF EXISTS "authenticated read order item componentes" ON order_item_componentes;
CREATE POLICY "authenticated read order item componentes" ON order_item_componentes
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "public insert order item componentes" ON order_item_componentes;
CREATE POLICY "public insert order item componentes" ON order_item_componentes
  FOR INSERT WITH CHECK (true);

COMMIT;
