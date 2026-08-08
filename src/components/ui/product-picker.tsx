import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, ChevronDown, X, Loader2, Package, Check } from 'lucide-react'
import { cn, formatPrice } from '@/lib/utils'
import { searchProducts, fetchProductsByIds, type ProductSearchResult } from '@/features/products/api/products.api'
import { Input } from './input'
import { Popover, PopoverTrigger, PopoverContent } from './popover'

interface ProductPickerProps {
  value: string | null
  onChange: (id: string | null) => void
  /** Ids to hide from results entirely (e.g. the bundle itself — never its own components). */
  excludeIds?: string[]
  excludeTipo?: 'paquete'
  /** Ids to keep visible but visually flag as "ya agregado" instead of hiding. */
  addedIds?: string[]
  placeholder?: string
}

function ProductThumb({ imageUrl, className }: { imageUrl?: string; className?: string }) {
  return imageUrl ? (
    <img src={imageUrl} alt="" className={cn('object-cover bg-muted shrink-0', className)} loading="lazy" />
  ) : (
    <div className={cn('flex items-center justify-center bg-muted shrink-0', className)}>
      <Package className="h-3.5 w-3.5 text-muted-foreground/40" />
    </div>
  )
}

function ResultRow({
  product,
  alreadyAdded,
  onSelect,
}: {
  product: ProductSearchResult
  alreadyAdded: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm hover:bg-muted transition-colors min-h-11"
    >
      <ProductThumb imageUrl={product.imageUrl} className="h-8 w-8 rounded" />
      <span className="min-w-0 flex-1 flex flex-col">
        <span className="truncate font-medium leading-tight">{product.nombre}</span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {formatPrice(product.precio)}
          {product.estado === 'agotado' && (
            <span className="text-amber-600 font-medium">· Agotado</span>
          )}
          {product.tipo === 'paquete' && <span>· Paquete</span>}
        </span>
      </span>
      {alreadyAdded && (
        <span className="shrink-0 flex items-center gap-1 rounded-full bg-accent/10 text-accent text-[10px] font-semibold px-2 py-0.5">
          <Check className="h-3 w-3" />
          Agregado
        </span>
      )}
    </button>
  )
}

export function ProductPicker({
  value,
  onChange,
  excludeIds = [],
  excludeTipo,
  addedIds = [],
  placeholder = 'Buscar producto…',
}: ProductPickerProps) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300)
    return () => clearTimeout(t)
  }, [q])

  const excludeKey = excludeIds.join(',')
  const { data: results, isFetching } = useQuery({
    queryKey: ['product-search', debouncedQ, excludeTipo, excludeKey],
    queryFn: () => searchProducts(debouncedQ, { excludeTipo, excludeIds }),
    enabled: open && debouncedQ.trim().length > 0,
  })

  const { data: selectedList } = useQuery({
    queryKey: ['product-by-id', value],
    queryFn: () => fetchProductsByIds(value ? [value] : []),
    enabled: !!value,
  })
  const selected = selectedList?.[0]

  const filteredResults = results ?? []
  const addedSet = new Set(addedIds)

  function handleSelect(id: string) {
    onChange(id)
    setOpen(false)
    setQ('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-card px-3 py-1 text-sm shadow-xs',
            'focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring',
            selected ? 'text-foreground' : 'text-muted-foreground',
          )}
        >
          <span className="flex items-center gap-2 min-w-0 flex-1">
            {selected && <ProductThumb imageUrl={selected.imageUrl} className="h-6 w-6 rounded" />}
            <span className="truncate">{selected ? selected.nombre : placeholder}</span>
          </span>
          <span className="flex items-center gap-1 shrink-0">
            {selected && (
              <X
                className="h-3.5 w-3.5 hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  onChange(null)
                }}
              />
            )}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-2 w-[min(24rem,90vw)]">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Escribe el nombre del producto…"
            className="pl-8 h-9 text-sm"
          />
        </div>
        <div className="mt-2 max-h-72 overflow-y-auto flex flex-col gap-0.5">
          {isFetching && (
            <div className="flex items-center justify-center py-4 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}
          {!isFetching && debouncedQ.trim() && filteredResults.length === 0 && (
            <p className="text-center text-xs text-muted-foreground py-4">
              Sin resultados para "{debouncedQ.trim()}".
            </p>
          )}
          {!isFetching && !debouncedQ.trim() && (
            <p className="text-center text-xs text-muted-foreground py-4">Escribe el nombre del producto.</p>
          )}
          {filteredResults.map((p) => (
            <ResultRow key={p.id} product={p} alreadyAdded={addedSet.has(p.id)} onSelect={() => handleSelect(p.id)} />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
