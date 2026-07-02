import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateOrderStatus, type OrderStatus } from '../api/orders.api'
import { ORDERS_KEY, orderQueryKey } from './useOrders'

export function useUpdateOrderStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: OrderStatus; notes?: string | null }) =>
      updateOrderStatus(id, status, notes),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ORDERS_KEY })
      qc.invalidateQueries({ queryKey: orderQueryKey(id) })
    },
  })
}
