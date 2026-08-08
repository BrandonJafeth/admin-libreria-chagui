import { Suspense, useState } from 'react'
import { createFileRoute, useRouteContext } from '@tanstack/react-router'
import { Info, Image as ImageIcon, Palette, Boxes } from 'lucide-react'
import { productQueryKey } from '@/features/products/hooks/useProduct'
import { fetchProduct } from '@/features/products/api/products.api'
import { useProduct } from '@/features/products/hooks/useProduct'
import { useUpdateProduct } from '@/features/products/hooks/useProductMutations'
import { ProductForm, type ProductFormValues } from '@/features/products/components/ProductForm'
import { sileo } from 'sileo'
import { mapSupabaseError } from '@/lib/errors'
import { ImageUploader } from '@/features/products/components/ImageUploader'
import { ColorPicker } from '@/features/products/components/ColorPicker'
import { BundleItemsPicker } from '@/features/products/components/BundleItemsPicker'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
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
  const { userRole } = useRouteContext({ from: '/_authenticated' })
  const isAdmin = userRole === 'admin'
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

      <div className="card-solid rounded-xl px-6">
        <Accordion type="single" collapsible defaultValue="info">
          <AccordionItem value="info">
            <AccordionTrigger>
              <span className="flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                Información
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <ProductForm
                defaultValues={{ ...product, category_ids: currentCategoryIds }}
                onSubmit={handleSubmit}
                isLoading={updateMutation.isPending}
                submitLabel="Actualizar"
                apiError={apiError}
                bundleItemsCount={product.product_bundle_items.length}
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="imagenes">
            <AccordionTrigger>
              <span className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                Imágenes
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <ImageUploader productId={productId} images={product.product_images} colorsCount={product.product_colors.length} />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="colores">
            <AccordionTrigger>
              <span className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-muted-foreground" />
                Colores
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <ColorPicker productId={productId} colors={product.product_colors} />
            </AccordionContent>
          </AccordionItem>

          {product.tipo === 'paquete' && (
            <AccordionItem value="componentes">
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  <Boxes className="h-4 w-4 text-muted-foreground" />
                  Componentes del paquete
                  {product.product_bundle_items.length > 0 && (
                    <span className="text-xs font-normal text-muted-foreground">({product.product_bundle_items.length})</span>
                  )}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <BundleItemsPicker paqueteId={productId} items={product.product_bundle_items} isAdmin={isAdmin} />
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </div>
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
