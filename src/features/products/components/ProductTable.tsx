import { useState, useEffect } from 'react'
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
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Pagination } from '@/components/ui/pagination'
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
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ProductForm, type ProductFormValues } from './ProductForm'
import { ImageUploader } from './ImageUploader'
import { ColorPicker } from './ColorPicker'
import { formatPrice } from '@/lib/utils'
import { useRouteContext } from '@tanstack/react-router'
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

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const
type ViewMode = 'grid' | 'table'

// ─── Main component ───────────────────────────────────────────────────────────

export function ProductTable() {
  const { userRole } = useRouteContext({ from: '/_authenticated' })
  const isAdmin = userRole === 'admin'

  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [estadoFilter, setEstadoFilter] = useState<'todos' | 'disponible' | 'agotado'>('todos')
  const [destacadoFilter, setDestacadoFilter] = useState<'todos' | 'si' | 'no'>('todos')
  const [categoryFilter, setCategoryFilter] = useState<string>('todas')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<10 | 20 | 50>(10)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<ProductListItem | null>(null)

  // Debounce search — avoid query on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 350)
    return () => clearTimeout(t)
  }, [q])

  // Reset to page 1 on any filter or page size change
  useEffect(() => {
    setPage(1)
  }, [debouncedQ, estadoFilter, destacadoFilter, categoryFilter, pageSize])

  const { data, isLoading, error } = useProducts({
    q: debouncedQ || undefined,
    estado: estadoFilter !== 'todos' ? estadoFilter : undefined,
    destacado: destacadoFilter !== 'todos' ? destacadoFilter === 'si' : undefined,
    categoryId: categoryFilter !== 'todas' ? categoryFilter : undefined,
    page,
    pageSize,
  })

  const products = data?.data ?? []
  const total = data?.count ?? 0

  const { data: categories } = useCategories()
  const createMutation = useCreateProduct()
  const deleteMutation = useDeleteProduct()

  const hasFilters =
    estadoFilter !== 'todos' || destacadoFilter !== 'todos' || categoryFilter !== 'todas'
  const activeFilterCount = [
    estadoFilter !== 'todos',
    destacadoFilter !== 'todos',
    categoryFilter !== 'todas',
  ].filter(Boolean).length

  function clearFilters() {
    setEstadoFilter('todos')
    setDestacadoFilter('todos')
    setCategoryFilter('todas')
  }

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

  async function confirmDelete() {
    if (!pendingDelete) return
    try {
      await deleteMutation.mutateAsync(pendingDelete.id)
      setPendingDelete(null)
    } catch {
      // error shown in dialog description via deleteMutation.isError
    }
  }

  const mainImage = (p: ProductListItem) =>
    p.product_images.find((i) => i.es_principal) ?? p.product_images[0]

  if (error) {
    return <p className="text-destructive text-sm">Error cargando productos: {error.message}</p>
  }

  return (
    <div className="space-y-5">
      {/* ── Top bar: search + actions ── */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar productos…"
            className="pl-8"
          />
          {q && (
            <button
              onClick={() => setQ('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* View toggle (hidden on mobile, shown sm+) */}
        <div className="hidden sm:flex items-center border border-border rounded-lg overflow-hidden shrink-0">
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
          <span className="hidden sm:inline">Nuevo producto</span>
          <span className="sm:hidden">Nuevo</span>
        </Button>
      </div>

      {/* ── Filter row ── */}
      <div className="flex flex-col gap-2">
        {/* Mobile: toggle + view */}
        <div className="flex items-center gap-2 sm:hidden">
          <button
            onClick={() => setFiltersOpen((o) => !o)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors ${
              hasFilters
                ? 'border-accent text-accent bg-accent/5'
                : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filtros
            {activeFilterCount > 0 && (
              <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-white text-[10px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          <div className="flex items-center border border-border rounded-lg overflow-hidden ml-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-accent text-white' : 'text-muted-foreground'}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 transition-colors ${viewMode === 'table' ? 'bg-accent text-white' : 'text-muted-foreground'}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              Limpiar
            </button>
          )}
        </div>

        {/* Desktop: inline compact filters */}
        <div className="hidden sm:flex items-center gap-2 flex-wrap">
          <Select
            value={estadoFilter}
            onValueChange={(v) => setEstadoFilter(v as typeof estadoFilter)}
          >
            <SelectTrigger
              className={`h-8 w-auto gap-1.5 rounded-full px-3 text-xs ${
                estadoFilter !== 'todos'
                  ? 'border-accent text-accent bg-accent/5'
                  : 'border-border text-muted-foreground'
              }`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Estado</SelectItem>
              <SelectItem value="disponible">Disponible</SelectItem>
              <SelectItem value="agotado">Agotado</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={destacadoFilter}
            onValueChange={(v) => setDestacadoFilter(v as typeof destacadoFilter)}
          >
            <SelectTrigger
              className={`h-8 w-auto gap-1.5 rounded-full px-3 text-xs ${
                destacadoFilter !== 'todos'
                  ? 'border-accent text-accent bg-accent/5'
                  : 'border-border text-muted-foreground'
              }`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Destacado</SelectItem>
              <SelectItem value="si">Destacados</SelectItem>
              <SelectItem value="no">No destacados</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger
              className={`h-8 w-auto gap-1.5 rounded-full px-3 text-xs ${
                categoryFilter !== 'todas'
                  ? 'border-accent text-accent bg-accent/5'
                  : 'border-border text-muted-foreground'
              }`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Categoría</SelectItem>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3" />
              Limpiar filtros
            </button>
          )}

          <div className="ml-auto flex items-center gap-1">
            <span className="text-xs text-muted-foreground mr-1">Mostrar:</span>
            {PAGE_SIZE_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => setPageSize(n)}
                className={`h-6 w-8 rounded text-xs font-medium transition-colors ${
                  pageSize === n
                    ? 'bg-accent text-white'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile: collapsible filter selects */}
        {filtersOpen && (
          <div className="flex flex-col gap-2 sm:hidden p-3 border border-border rounded-xl bg-muted/30">
            <Select
              value={estadoFilter}
              onValueChange={(v) => setEstadoFilter(v as typeof estadoFilter)}
            >
              <SelectTrigger className="w-full text-sm">
                <SelectValue placeholder="Estado" />
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
              <SelectTrigger className="w-full text-sm">
                <SelectValue placeholder="Destacado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="si">Destacados</SelectItem>
                <SelectItem value="no">No destacados</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full text-sm">
                <SelectValue placeholder="Categoría" />
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

            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-muted-foreground">Mostrar:</span>
              <div className="flex gap-1">
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <button
                    key={n}
                    onClick={() => setPageSize(n)}
                    className={`h-7 w-10 rounded text-xs font-medium transition-colors ${
                      pageSize === n
                        ? 'bg-accent text-white'
                        : 'border border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Loading skeleton ── */}
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

      {/* ── Empty state ── */}
      {!isLoading && products.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Package className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm font-medium">Sin productos</p>
          <p className="text-muted-foreground/60 text-xs mt-1">
            {debouncedQ || hasFilters
              ? 'Ningún producto coincide con los filtros.'
              : 'Crea el primero para comenzar.'}
          </p>
          {!debouncedQ && !hasFilters && (
            <Button variant="outline" size="sm" className="mt-4" onClick={() => setCreating(true)}>
              Crear producto
            </Button>
          )}
        </div>
      )}

      {/* ── Grid view ── */}
      {!isLoading && products.length > 0 && viewMode === 'grid' && (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              mainImageUrl={mainImage(p)?.url}
              onEdit={() => setEditingId(p.id)}
              onDelete={() => setPendingDelete(p)}
              isDeleting={deleteMutation.isPending && deleteMutation.variables === p.id}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}

      {/* ── Table view ── */}
      {!isLoading && products.length > 0 && viewMode === 'table' && (
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
                {products.map((p) => (
                  <ProductTableRow
                    key={p.id}
                    product={p}
                    mainImageUrl={mainImage(p)?.url}
                    onEdit={() => setEditingId(p.id)}
                    onDelete={() => setPendingDelete(p)}
                    isDeleting={deleteMutation.isPending && deleteMutation.variables === p.id}
                    isAdmin={isAdmin}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* ── Pagination ── */}
      {!isLoading && total > 0 && (
        <div className="flex flex-col items-center gap-2">
          <Pagination page={page} total={total} pageSize={pageSize} onChange={setPage} />
          <p className="text-xs text-muted-foreground">
            Mostrando {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} de {total}
          </p>
        </div>
      )}

      {/* ── Delete confirmation ── */}
      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(o) => { if (!o) { setPendingDelete(null); deleteMutation.reset() } }}
        title={`¿Eliminar "${pendingDelete?.nombre}"?`}
        description={
          deleteMutation.isError
            ? `Error: ${deleteMutation.error?.message}`
            : 'Esta acción no se puede deshacer.'
        }
        onConfirm={confirmDelete}
        isLoading={deleteMutation.isPending}
      />

      {/* ── Create sheet ── */}
      <Sheet open={creating} onOpenChange={setCreating}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Nuevo producto</SheetTitle>
            <SheetDescription>Completa la información básica del producto.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <ProductForm
              onSubmit={handleCreate}
              onCancel={() => setCreating(false)}
              isLoading={createMutation.isPending}
              submitLabel="Crear producto"
            />
            {createMutation.isError && (
              <p className="text-sm text-destructive mt-3">{createMutation.error.message}</p>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Edit sheet ── */}
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

// ─── Product Card ─────────────────────────────────────────────────────────────

interface ProductCardProps {
  product: ProductListItem
  mainImageUrl?: string
  onEdit: () => void
  onDelete: () => void
  isDeleting: boolean
  isAdmin: boolean
}

function ProductCard({ product, mainImageUrl, onEdit, onDelete, isDeleting, isAdmin }: ProductCardProps) {
  const toggleEstadoMutation = useToggleEstado(product.id)
  const toggleDestacadoMutation = useToggleDestacado(product.id)

  return (
    <div className="card-solid rounded-xl overflow-hidden flex flex-col">
      <div className="relative aspect-square bg-muted overflow-hidden">
        {mainImageUrl ? (
          <img src={mainImageUrl} alt={product.nombre} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-8 w-8 text-muted-foreground/25" />
          </div>
        )}
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
          <Star className="h-3 w-3" fill={product.destacado ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="px-3 pt-2.5 pb-1 flex flex-col gap-1.5">
        <p className="text-sm font-medium leading-tight line-clamp-2 min-h-10">{product.nombre}</p>
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

      <div className="flex items-center border-t border-border/60 mt-1">
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </button>
        {isAdmin && (
          <>
            <div className="w-px h-5 bg-border/60" />
            <button
              onClick={onDelete}
              disabled={isDeleting}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-destructive hover:bg-destructive/8 transition-colors disabled:opacity-40"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Eliminar
            </button>
          </>
        )}
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
  isAdmin: boolean
}

function ProductTableRow({ product, mainImageUrl, onEdit, onDelete, isDeleting, isAdmin }: ProductTableRowProps) {
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
            toggleEstadoMutation.mutate(product.estado === 'disponible' ? 'agotado' : 'disponible')
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
            product.destacado ? 'text-accent bg-accent/10' : 'text-muted-foreground hover:text-amber-500'
          }`}
          title={product.destacado ? 'Quitar destacado' : 'Destacar'}
        >
          <Star className="h-4 w-4" fill={product.destacado ? 'currentColor' : 'none'} />
        </button>
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={onEdit} title="Editar">
            <Pencil className="h-4 w-4" />
          </Button>
          {isAdmin && (
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
          )}
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
          <SheetTitle>{isLoading ? 'Cargando…' : (product?.nombre ?? 'Editar producto')}</SheetTitle>
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
                  onCancel={() => onOpenChange(false)}
                  isLoading={updateMutation.isPending}
                  submitLabel="Actualizar"
                />
                {updateMutation.isError && (
                  <p className="text-sm text-destructive mt-2">{updateMutation.error.message}</p>
                )}
              </section>

              <Separator />

              <section>
                <SectionLabel icon={<ImageIcon className="h-3.5 w-3.5" />} title="Imágenes" />
                <ImageUploader
                  productId={productId}
                  images={product.product_images}
                  colorsCount={product.product_colors.length}
                />
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
