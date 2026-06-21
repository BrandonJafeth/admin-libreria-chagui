-- RLS policies for admin-libreria-chagui
-- All tables: enable RLS. Service role bypasses all policies automatically.

-- Helper: read caller's role without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$;

-- ─── profiles ────────────────────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own row; admins can read all
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.get_my_role() = 'admin');

-- No INSERT/UPDATE/DELETE for authenticated users.
-- create-user and delete-user edge functions use the service role key
-- which bypasses RLS entirely.

-- ─── products ────────────────────────────────────────────────────────────────
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_select" ON products
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "products_insert" ON products
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "products_update" ON products
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Only admins can delete products
CREATE POLICY "products_delete" ON products
  FOR DELETE TO authenticated
  USING (public.get_my_role() = 'admin');

-- ─── categories ──────────────────────────────────────────────────────────────
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_select" ON categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "categories_insert" ON categories
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "categories_update" ON categories
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "categories_delete" ON categories
  FOR DELETE TO authenticated
  USING (public.get_my_role() = 'admin');

-- ─── product_images ───────────────────────────────────────────────────────────
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_images_select" ON product_images
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "product_images_insert" ON product_images
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "product_images_update" ON product_images
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "product_images_delete" ON product_images
  FOR DELETE TO authenticated USING (true);

-- ─── product_colors ───────────────────────────────────────────────────────────
ALTER TABLE product_colors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_colors_select" ON product_colors
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "product_colors_insert" ON product_colors
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "product_colors_update" ON product_colors
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "product_colors_delete" ON product_colors
  FOR DELETE TO authenticated USING (true);

-- ─── product_categories ───────────────────────────────────────────────────────
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_categories_select" ON product_categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "product_categories_insert" ON product_categories
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "product_categories_delete" ON product_categories
  FOR DELETE TO authenticated USING (true);
