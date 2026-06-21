import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ProductForm, type ProductFormValues } from '@/features/products/components/ProductForm'
import { useCreateProduct } from '@/features/products/hooks/useProductMutations'
import { sileo } from 'sileo'
import { td } from '@/lib/td'

export const Route = createFileRoute('/_authenticated/productos/nuevo')({
  staticData: { breadcrumb: 'Nuevo producto' },
  component: NuevoProductoPage,
})

function NuevoProductoPage() {
  const navigate = useNavigate()
  const createMutation = useCreateProduct()
  const [apiError, setApiError] = useState<string | undefined>()

  async function handleSubmit(values: ProductFormValues) {
    setApiError(undefined)
    const { category_ids, ...product } = values
    try {
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
      sileo.success({
        title: 'Producto creado',
        description: td('**Siguiente paso:** sube imágenes y configura colores.\n- Imágenes desde la pestaña de fotos\n- Colores desde la paleta'),
      })
      await navigate({
        to: '/productos/$productId',
        params: { productId: created.id },
      })
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Error desconocido. Intenta de nuevo.')
    }
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
          apiError={apiError}
        />
      </div>
    </div>
  )
}
