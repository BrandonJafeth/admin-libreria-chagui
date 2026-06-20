import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Package,
  Plus,
  Search,
  Star,
  Trash2,
  Pencil,
  Image as ImageIcon,
  Palette,
  Info,
  LayoutGrid,
  List,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { ProductForm, type ProductFormValues } from './ProductForm'
import { ImageUploader } from './ImageUploader'
import { ColorPicker } from './ColorPicker'
import { formatPrice } from '@/lib/utils'
import { useProducts } from '../hooks/useProducts'
import { useCategories } from '@/features/categories/hooks/useCategories'
import { fetchProduct } from '../api/products.api'
import { productQueryKey } from '../hooks/useProduct'
import {
  useCreateProduct,
  useDeleteProduct,
  useToggleEstado,
  useToggleDestacado,
  useUpdateProduct,
} from '../hooks/useProductMutations'
import type { ProductListItem } from '../api/products.api'

type ViewMode = 'grid' | 'table'

// ─── Main component ───────────────────────────────────────────────────────────

export function ProductTable() {
  const [q, setQ] = useState('')
  const [estadoFilter, setEstadoFilter] = useState<'todos' | 'disponible' | 'agotado'>('todos')
  const [destacadoFilter, setDestacadoFilter] = useState<'todos' | 'si' | 'no'>('todos')
  const [categoryFilter, setCategoryFilter] = useState<string>('todas')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const { data: products, isLoading, error } = useProducts({
    q: q || undefined,
    estado: estadoFilter !== 'todos' ? estadoFilter : undefined,
    destacado: destacadoFilter !== 'todos' ? destacadoFilter === 'si' : undefined,
  })

  const { data: categories } = useCategories()
  const createMutation = useCreateProduct()
  const deleteMutation = useDeleteProduct()

  const filteredProducts = useMemo(() => {
    if (!products) return []
    if (categoryFilter === 'todas') return products
    return products.filter((p) =>
      p.product_categories.some((pc) => pc.category_id === categoryFilter),
    )
  }, [products, categoryFilter])

  async function handleCreate(values: ProductFormValues) {
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
    setCreating(false)
    setEditingId(created.id)
  }

  async function handleDelete(product: ProductListItem) {
    if (!confirm(`¿Eliminar "${product.nombre}"? Esta acción no se puede deshacer.`)) return
    await deleteMutation.mutateAsync(product.id)
  }

  const mainImage = (p: ProductListItem) =>
    p.product_images.find((i) => i.es_principal) ?? p.product_images[0]

  if (error) {
    return <p className="text-destructive text-sm">Error cargando productos: {error.message}</p>
  }

  return (
    <div className="space-y-5">
      {/* Filter bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        {/* Search */}
        <div className="relative sm:flex-1 sm:min-w-36">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre…"
            className="pl-8 w-full"
          />
        </div>

        {/* Selects: 2-col grid on mobile, inline flex on sm+ */}
        <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
          <Select
            value={estadoFilter}
            onValueChange={(v) => setEstadoFilter(v as typeof estadoFilter)}
          >
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="disponible">Disponible</SelectItem>
              <SelectItem value="agotado">Agotado</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={destacadoFilter}
            onValueChange={(v) => setDestacadoFilter(v as typeof destacadoFilter)}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="si">Destacados</SelectItem>
              <SelectItem value="no">No destacados</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="col-span-2 w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las categorías</SelectItem>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* View toggle + New */}
        <div className="flex items-center justify-between gap-2 sm:ml-auto sm:justify-end">
          <div className="flex items-center border border-border rounded-lg overflow-hidden shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-accent text-white'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              title="Vista de tarjetas"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 transition-colors ${
                viewMode === 'table'
                  ? 'bg-accent text-white'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              title="Vista de tabla"
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <Button onClick={() => setCreating(true)} size="sm" className="shrink-0">
            <Plus className="h-4 w-4" />
            Nuevo producto
          </Button>
        </div>
      </div>

      {/* Loading skeleton */}
      {isLoading && viewMode === 'grid' && (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-muted animate-pulse aspect-3/4" />
          ))}
        </div>
      )}
      {isLoading && viewMode === 'table' && (
        <div className="card-solid rounded-xl overflow-hidden animate-pulse">
          <div className="h-10 bg-muted/60" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 border-t border-border bg-muted/20" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredProducts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Package className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm font-medium">Sin productos</p>
          <p className="text-muted-foreground/60 text-xs mt-1">
            {q || estadoFilter !== 'todos' || destacadoFilter !== 'todos' || categoryFilter !== 'todas'
              ? 'Ningún producto coincide con los filtros.'
              : 'Crea el primero para comenzar.'}
          </p>
          {!q && estadoFilter === 'todos' && destacadoFilter === 'todos' && categoryFilter === 'todas' && (
            <Button variant="outline" size="sm" className="mt-4" onClick={() => setCreating(true)}>
              Crear producto
            </Button>
          )}
        </div>
      )}

      {/* Grid view */}
      {!isLoading && filteredProducts.length > 0 && viewMode === 'grid' && (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filteredProducts.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              mainImageUrl={mainImage(p)?.url}
              onEdit={() => setEditingId(p.id)}
              onDelete={() => handleDelete(p)}
              isDeleting={deleteMutation.isPending && deleteMutation.variables === p.id}
            />
          ))}
        </div>
      )}

      {/* Table view */}
      {!isLoading && filteredProducts.length > 0 && viewMode === 'table' && (
        <div className="card-solid rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">Imagen</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead className="w-32">Precio</TableHead>
                <TableHead className="w-32">Estado</TableHead>
                <TableHead className="w-28">Destacado</TableHead>
                <TableHead className="w-24 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((p) => (
                <ProductTableRow
                  key={p.id}
                  product={p}
                  mainImageUrl={mainImage(p)?.url}
                  onEdit={() => setEditingId(p.id)}
                  onDelete={() => handleDelete(p)}
                  isDeleting={deleteMutation.isPending && deleteMutation.variables === p.id}
                />
              ))}
            </TableBody>
          </Table>
          </div>
        </div>
      )}

      {/* Create sheet */}
      <Sheet open={creating} onOpenChange={setCreating}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Nuevo producto</SheetTitle>
            <SheetDescription>Completa la información básica del producto.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <ProductForm
              onSubmit={handleCreate}
              isLoading={createMutation.isPending}
              submitLabel="Crear producto"
            />
            {createMutation.isError && (
              <p className="text-sm text-destructive mt-3">{createMutation.error.message}</p>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit sheet */}
      {editingId && (
        <ProductEditSheet
          productId={editingId}
          open={!!editingId}
          onOpenChange={(o) => !o && setEditingId(null)}
        />
      )}
    </div>
  )
}

// ─── Product Card (always-visible actions) ────────────────────────────────────

interface ProductCardProps {
  product: ProductListItem
  mainImageUrl?: string
  onEdit: () => void
  onDelete: () => void
  isDeleting: boolean
}

function ProductCard({ product, mainImageUrl, onEdit, onDelete, isDeleting }: ProductCardProps) {
  const toggleEstadoMutation = useToggleEstado(product.id)
  const toggleDestacadoMutation = useToggleDestacado(product.id)

  return (
    <div className="card-solid rounded-xl overflow-hidden flex flex-col">
      {/* Image */}
      <div className="relative aspect-square bg-muted overflow-hidden">
        {mainImageUrl ? (
          <img
            src={mainImageUrl}
            alt={product.nombre}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-8 w-8 text-muted-foreground/25" />
          </div>
        )}
        {/* Star - always visible */}
        <button
          onClick={() => toggleDestacadoMutation.mutate(!product.destacado)}
          disabled={toggleDestacadoMutation.isPending}
          className={`absolute top-2 right-2 rounded-full p-1.5 shadow-sm transition-all active:scale-95 ${
            product.destacado
              ? 'bg-accent text-white shadow-accent/30'
              : 'bg-white/90 text-muted-foreground hover:text-amber-500'
          }`}
          title={product.destacado ? 'Quitar destacado' : 'Marcar como destacado'}
        >
          <Star
            className="h-3 w-3"
            fill={product.destacado ? 'currentColor' : 'none'}
          />
        </button>
      </div>

      {/* Info */}
      <div className="px-3 pt-2.5 pb-1 flex flex-col gap-1.5">
        <p className="text-sm font-medium leading-tight line-clamp-2 min-h-10">
          {product.nombre}
        </p>
        <div className="flex items-center justify-between gap-1">
          <span className="text-sm font-semibold text-accent">{formatPrice(product.precio)}</span>
          <button
            onClick={() =>
              toggleEstadoMutation.mutate(
                product.estado === 'disponible' ? 'agotado' : 'disponible',
              )
            }
            disabled={toggleEstadoMutation.isPending}
            title="Cambiar estado"
          >
            <Badge
              variant={product.estado === 'disponible' ? 'success' : 'warning'}
              className="cursor-pointer text-[10px] px-1.5 py-0 hover:opacity-80 transition-opacity"
            >
              {product.estado === 'disponible' ? 'Disponible' : 'Agotado'}
            </Badge>
          </button>
        </div>
      </div>

      {/* Always-visible action row */}
      <div className="flex items-center border-t border-border/60 mt-1">
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </button>
        <div className="w-px h-5 bg-border/60" />
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-destructive hover:bg-destructive/8 transition-colors disabled:opacity-40"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Eliminar
        </button>
      </div>
    </div>
  )
}

// ─── Product Table Row ────────────────────────────────────────────────────────

interface ProductTableRowProps {
  product: ProductListItem
  mainImageUrl?: string
  onEdit: () => void
  onDelete: () => void
  isDeleting: boolean
}

function ProductTableRow({
  product,
  mainImageUrl,
  onEdit,
  onDelete,
  isDeleting,
}: ProductTableRowProps) {
  const toggleEstadoMutation = useToggleEstado(product.id)
  const toggleDestacadoMutation = useToggleDestacado(product.id)

  return (
    <TableRow>
      <TableCell>
        {mainImageUrl ? (
          <img
            src={mainImageUrl}
            alt={product.nombre}
            className="h-10 w-10 rounded-lg object-cover border border-border"
          />
        ) : (
          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
            <Package className="h-4 w-4 text-muted-foreground/30" />
          </div>
        )}
      </TableCell>
      <TableCell>
        <span className="font-medium">{product.nombre}</span>
        <span className="block text-xs font-mono text-muted-foreground">{product.slug}</span>
      </TableCell>
      <TableCell className="font-semibold text-accent">{formatPrice(product.precio)}</TableCell>
      <TableCell>
        <Badge
          variant={product.estado === 'disponible' ? 'success' : 'warning'}
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() =>
            toggleEstadoMutation.mutate(
              product.estado === 'disponible' ? 'agotado' : 'disponible',
            )
          }
        >
          {product.estado === 'disponible' ? 'Disponible' : 'Agotado'}
        </Badge>
      </TableCell>
      <TableCell>
        <button
          onClick={() => toggleDestacadoMutation.mutate(!product.destacado)}
          disabled={toggleDestacadoMutation.isPending}
          className={`rounded-full p-1.5 transition-colors active:scale-95 ${
            product.destacado
              ? 'text-accent bg-accent/10'
              : 'text-muted-foreground hover:text-amber-500'
          }`}
          title={product.destacado ? 'Quitar destacado' : 'Destacar'}
        >
          <Star
            className="h-4 w-4"
            fill={product.destacado ? 'currentColor' : 'none'}
          />
        </button>
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={onEdit} title="Editar">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            disabled={isDeleting}
            className="text-destructive hover:text-destructive"
            title="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

// ─── Edit Sheet ───────────────────────────────────────────────────────────────

interface ProductEditSheetProps {
  productId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

function ProductEditSheet({ productId, open, onOpenChange }: ProductEditSheetProps) {
  const { data: product, isLoading } = useQuery({
    queryKey: productQueryKey(productId),
    queryFn: () => fetchProduct(productId),
    enabled: open && !!productId,
  })

  const updateMutation = useUpdateProduct(productId)

  async function handleSubmit(values: ProductFormValues) {
    const { category_ids, ...updates } = values
    await updateMutation.mutateAsync({ updates, categoryIds: category_ids })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>
            {isLoading ? 'Cargando…' : (product?.nombre ?? 'Editar producto')}
          </SheetTitle>
          {product && (
            <SheetDescription className="font-mono text-xs">{product.slug}</SheetDescription>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-9 bg-muted rounded" />
              ))}
            </div>
          ) : product ? (
            <>
              <section>
                <SectionLabel icon={<Info className="h-3.5 w-3.5" />} title="Información" />
                <ProductForm
                  defaultValues={{
                    ...product,
                    category_ids: product.product_categories.map((pc) => pc.category_id),
                  }}
                  onSubmit={handleSubmit}
                  isLoading={updateMutation.isPending}
                  submitLabel="Actualizar"
                />
                {updateMutation.isError && (
                  <p className="text-sm text-destructive mt-2">
                    {updateMutation.error.message}
                  </p>
                )}
              </section>

              <Separator />

              <section>
                <SectionLabel icon={<ImageIcon className="h-3.5 w-3.5" />} title="Imágenes" />
                <ImageUploader productId={productId} images={product.product_images} />
              </section>

              <Separator />

              <section>
                <SectionLabel icon={<Palette className="h-3.5 w-3.5" />} title="Colores" />
                <ColorPicker productId={productId} colors={product.product_colors} />
              </section>
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function SectionLabel({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-muted-foreground">{icon}</span>
      <span className="font-heading font-semibold text-sm text-foreground">{title}</span>
    </div>
  )
}
