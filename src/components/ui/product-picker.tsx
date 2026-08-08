import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, ChevronDown, X, Loader2 } from 'lucide-react'
import { cn, formatPrice } from '@/lib/utils'
import { searchProducts, fetchProductsByIds } from '@/features/products/api/products.api'
import { Input } from './input'
import { Popover, PopoverTrigger, PopoverContent } from './popover'

interface ProductPickerProps {
  value: string | null
  onChange: (id: string | null) => void
  excludeIds?: string[]
  excludeTipo?: 'paquete'
  placeholder?: string
}

export function ProductPicker({ value, onChange, excludeIds = [], excludeTipo, placeholder = 'Buscar producto…' }: ProductPickerProps) {
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
            'flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-card px-3 py-1 text-sm shadow-xs',
            'focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring',
            selected ? 'text-foreground' : 'text-muted-foreground',
          )}
        >
          <span className="truncate">{selected ? selected.nombre : placeholder}</span>
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
      <PopoverContent className="p-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Escribe para buscar…"
            className="pl-8 h-8 text-sm"
          />
        </div>
        <div className="mt-2 max-h-64 overflow-y-auto flex flex-col gap-0.5">
          {isFetching && (
            <div className="flex items-center justify-center py-4 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}
          {!isFetching && debouncedQ.trim() && filteredResults.length === 0 && (
            <p className="text-center text-xs text-muted-foreground py-4">Sin resultados.</p>
          )}
          {!isFetching && !debouncedQ.trim() && (
            <p className="text-center text-xs text-muted-foreground py-4">Escribe el nombre del producto.</p>
          )}
          {filteredResults.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelect(p.id)}
              className="flex items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-muted transition-colors"
            >
              <span className="truncate">{p.nombre}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{formatPrice(p.precio)}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
