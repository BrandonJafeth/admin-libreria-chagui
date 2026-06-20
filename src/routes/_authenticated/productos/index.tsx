import { createFileRoute } from '@tanstack/react-router'
import { ProductTable } from '@/features/products/components/ProductTable'

export const Route = createFileRoute('/_authenticated/productos/')({
  staticData: { breadcrumb: 'Productos' },
  component: ProductosPage,
})

function ProductosPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-semibold text-foreground">Productos</h1>
      <ProductTable />
    </div>
  )
}
