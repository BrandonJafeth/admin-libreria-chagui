import { supabase } from '@/lib/supabase/client'
import type { Tables, Updatable } from '@/types/database.types'

export type Order = Tables<'orders'>
export type OrderItem = Tables<'order_items'>
export type OrderStatus = Order['status']
export type OrderUpdate = Updatable<'orders'>

export type OrderListItem = Order & {
  order_items: { id: string }[]
}

export type OrderDetail = Order & {
  order_items: OrderItem[]
}

export interface OrderFilters {
  status?: OrderStatus
}

export async function fetchOrders(filters?: OrderFilters): Promise<OrderListItem[]> {
  let query = supabase
    .from('orders')
    .select('*, order_items(id)')
    .order('created_at', { ascending: false })

  if (filters?.status) query = query.eq('status', filters.status)

  const { data, error } = await query
  if (error) throw error
  return data as OrderListItem[]
}

export async function fetchOrder(id: string): Promise<OrderDetail> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as OrderDetail
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  const { error } = await supabase.from('orders').update({ status }).eq('id', id)
  if (error) throw error
}
