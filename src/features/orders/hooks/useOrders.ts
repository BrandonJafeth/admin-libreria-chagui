import { useQuery } from '@tanstack/react-query'
import { fetchOrders, fetchOrder, type OrderFilters } from '../api/orders.api'

export const ORDERS_KEY = ['orders'] as const

export function ordersQueryKey(filters?: OrderFilters) {
  return [...ORDERS_KEY, filters ?? {}] as const
}

export function orderQueryKey(id: string) {
  return ['order', id] as const
}

export function useOrders(filters?: OrderFilters) {
  return useQuery({
    queryKey: ordersQueryKey(filters),
    queryFn: () => fetchOrders(filters),
  })
}

export function useOrder(id: string, enabled = true) {
  return useQuery({
    queryKey: orderQueryKey(id),
    queryFn: () => fetchOrder(id),
    enabled,
  })
}
