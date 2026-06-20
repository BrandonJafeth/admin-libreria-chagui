import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ProductForm, type ProductFormValues } from '@/features/products/components/ProductForm'
import { useCreateProduct } from '@/features/products/hooks/useProductMutations'

export const Route = createFileRoute('/_authenticated/productos/nuevo')({
  staticData: { breadcrumb: 'Nuevo producto' },
  component: NuevoProductoPage,
})

function NuevoProductoPage() {
  const navigate = useNavigate()
  const createMutation = useCreateProduct()

  async function handleSubmit(values: ProductFormValues) {
    const { category_ids, ...product } = values
    const created = await createMutation.mutateAsync({
      product: {
        nombre: product.nombre,
        slug: product.slug,
        precio: product.precio,
        descripcion: product.descripcion,
        estado: product.estado,
        destacado: product.destacado,
      },
      categoryIds: category_ids,
    })
    await navigate({
      to: '/productos/$productId',
      params: { productId: created.id },
    })
  }

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="font-heading text-2xl font-semibold text-foreground">
        Nuevo producto
      </h1>
      <div className="card-solid rounded-xl p-6">
        <ProductForm
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending}
          submitLabel="Crear producto"
        />
        {createMutation.isError && (
          <p className="text-sm text-destructive mt-3">
            {createMutation.error.message}
          </p>
        )}
      </div>
    </div>
  )
}
