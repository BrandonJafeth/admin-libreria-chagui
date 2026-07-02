import { Suspense, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { productQueryKey } from '@/features/products/hooks/useProduct'
import { fetchProduct } from '@/features/products/api/products.api'
import { useProduct } from '@/features/products/hooks/useProduct'
import { useUpdateProduct } from '@/features/products/hooks/useProductMutations'
import { ProductForm, type ProductFormValues } from '@/features/products/components/ProductForm'
import { sileo } from 'sileo'
import { mapSupabaseError } from '@/lib/errors'
import { ImageUploader } from '@/features/products/components/ImageUploader'
import { ColorPicker } from '@/features/products/components/ColorPicker'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

export const Route = createFileRoute('/_authenticated/productos/$productId')({
  staticData: { breadcrumb: 'Editar producto' },
  loader: async ({ context: { queryClient }, params: { productId } }) => {
    await queryClient.ensureQueryData({
      queryKey: productQueryKey(productId),
      queryFn: () => fetchProduct(productId),
    })
  },
  pendingMs: 0,
  pendingComponent: ProductSkeleton,
  errorComponent: ProductError,
  component: () => (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductDetailPage />
    </Suspense>
  ),
})

function ProductDetailPage() {
  const { productId } = Route.useParams()
  const { data: product } = useProduct(productId)
  const updateMutation = useUpdateProduct(productId)
  const [apiError, setApiError] = useState<string | undefined>()

  async function handleSubmit(values: ProductFormValues) {
    setApiError(undefined)
    const { category_ids, ...updates } = values
    try {
      await updateMutation.mutateAsync({ updates, categoryIds: category_ids })
      sileo.success({ title: 'Producto actualizado' })
    } catch (err) {
      const message = mapSupabaseError(err)
      setApiError(message)
      sileo.error({ title: 'Error al actualizar', description: message })
    }
  }

  const currentCategoryIds = product.product_categories.map((pc) => pc.category_id)

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          {product.nombre}
        </h1>
        <p className="text-sm font-mono text-muted-foreground mt-0.5">{product.slug}</p>
      </div>

      {/* Product fields */}
      <section className="card-solid rounded-xl p-6 space-y-2">
        <h2 className="font-heading font-semibold text-base text-foreground">
          Información
        </h2>
        <Separator className="mb-4" />
        <ProductForm
          defaultValues={{ ...product, category_ids: currentCategoryIds }}
          onSubmit={handleSubmit}
          isLoading={updateMutation.isPending}
          submitLabel="Actualizar"
          apiError={apiError}
        />
      </section>

      {/* Images */}
      <section className="card-solid rounded-xl p-6 space-y-2">
        <h2 className="font-heading font-semibold text-base text-foreground">
          Imágenes
        </h2>
        <Separator className="mb-4" />
        <ImageUploader productId={productId} images={product.product_images} colorsCount={product.product_colors.length} />
      </section>

      {/* Colors */}
      <section className="card-solid rounded-xl p-6 space-y-2">
        <h2 className="font-heading font-semibold text-base text-foreground">
          Colores
        </h2>
        <Separator className="mb-4" />
        <ColorPicker productId={productId} colors={product.product_colors} />
      </section>
    </div>
  )
}

function ProductSkeleton() {
  return (
    <div className="max-w-2xl space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="card-solid rounded-xl p-6 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    </div>
  )
}

function ProductError({ error }: { error: Error }) {
  return (
    <div className="max-w-md">
      <p className="text-destructive font-medium">Error cargando producto</p>
      <p className="text-sm text-muted-foreground mt-1">{mapSupabaseError(error)}</p>
    </div>
  )
}
