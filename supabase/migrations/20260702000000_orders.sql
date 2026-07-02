-- orders: pedido hecho desde el carrito del sitio público
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  notes text,
  total numeric NOT NULL,
  status text NOT NULL DEFAULT 'pendiente'
    CHECK (status IN ('pendiente', 'confirmado', 'cancelado')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- order_items: líneas del pedido (snapshot de nombre/precio por si el producto cambia luego)
CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  product_nombre text NOT NULL,
  color text,
  precio_unitario numeric NOT NULL,
  cantidad integer NOT NULL CHECK (cantidad > 0),
  subtotal numeric NOT NULL
);

-- RLS: público (anon) puede insertar desde el checkout del sitio; solo admin ve/edita
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_insert_public" ON orders
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "orders_select_admin" ON orders
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "orders_update_admin" ON orders
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "order_items_insert_public" ON order_items
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "order_items_select_admin" ON order_items
  FOR SELECT TO authenticated USING (true);
