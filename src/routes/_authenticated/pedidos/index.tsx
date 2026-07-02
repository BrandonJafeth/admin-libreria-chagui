import { createFileRoute } from '@tanstack/react-router'
import { OrdersTable } from '@/features/orders/components/OrdersTable'

export const Route = createFileRoute('/_authenticated/pedidos/')({
  staticData: { breadcrumb: 'Pedidos' },
  component: PedidosPage,
})

function PedidosPage() {
  return <OrdersTable />
}
