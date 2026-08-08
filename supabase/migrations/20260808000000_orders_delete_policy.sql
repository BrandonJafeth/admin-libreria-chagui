-- ============================================================
-- Migration: allow admins to delete orders
-- Ya corrida en producción — versionada acá para que un ambiente
-- nuevo la reciba. order_items no necesita política propia: ya tiene
-- ON DELETE CASCADE hacia orders (ver 20260702000000_orders.sql).
-- ============================================================

BEGIN;

DROP POLICY IF EXISTS "orders_delete_admin" ON orders;
CREATE POLICY "orders_delete_admin" ON orders
  FOR DELETE TO authenticated
  USING (public.get_my_role() = 'admin');

COMMIT;
