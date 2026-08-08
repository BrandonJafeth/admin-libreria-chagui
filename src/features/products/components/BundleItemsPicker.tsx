import { useState } from 'react'
import { Plus, Trash2, Loader2, CopyPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ProductPicker } from '@/components/ui/product-picker'
import { useAddBundleItem, useUpdateBundleItem, useDeleteBundleItem } from '../hooks/useProductMutations'
import type { BundleItem } from '../api/products.api'
import { formatPrice } from '@/lib/utils'
import { sileo } from 'sileo'
import { mapSupabaseError } from '@/lib/errors'

interface BundleItemsPickerProps {
  paqueteId: string
  items: (BundleItem & { producto: { id: string; nombre: string; precio: number } })[]
  isAdmin: boolean
}

export function BundleItemsPicker({ paqueteId, items, isAdmin }: BundleItemsPickerProps) {
  const [productoId, setProductoId] = useState<string | null>(null)
  const [cantidad, setCantidad] = useState('1')

  const addMutation = useAddBundleItem(paqueteId)
  const updateMutation = useUpdateBundleItem(paqueteId)
  const deleteMutation = useDeleteBundleItem(paqueteId)

  // Solo se oculta el paquete mismo (no puede contenerse a sí mismo). Los
  // productos ya agregados siguen siendo elegibles: volver a elegirlos suma
  // cantidad en vez de duplicar la fila (ver handleAdd).
  const existingItem = items.find((i) => i.producto_id === productoId) ?? null
  const isPending = addMutation.isPending || updateMutation.isPending

  async function handleAdd() {
    const qty = Number(cantidad)
    if (!productoId || !Number.isInteger(qty) || qty < 1) return
    try {
      if (existingItem) {
        const nuevaCantidad = existingItem.cantidad + qty
        await updateMutation.mutateAsync({ id: existingItem.id, cantidad: nuevaCantidad })
        sileo.success({ title: `Cantidad actualizada — ahora ×${nuevaCantidad}` })
      } else {
        await addMutation.mutateAsync({ productoId, cantidad: qty, orden: items.length })
        sileo.success({ title: 'Componente agregado' })
      }
      setProductoId(null)
      setCantidad('1')
    } catch (err) {
      sileo.error({ title: 'Error al agregar componente', description: mapSupabaseError(err) })
    }
  }

  return (
    <div className="space-y-3">
      {items.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {items.map((item) => (
            <div
              key={item.id}
              className="group flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm"
            >
              <div className="min-w-0 flex items-center gap-2">
                <span className="truncate font-medium text-foreground">{item.producto.nombre}</span>
                {item.cantidad > 1 && (
                  <Badge variant="info" className="shrink-0 text-[10px] px-1.5 py-0 font-semibold">
                    ×{item.cantidad}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground shrink-0">{formatPrice(item.producto.precio)}</span>
              </div>
              {isAdmin && (
                <button
                  onClick={() => deleteMutation.mutate(item.id, {
                    onSuccess: () => sileo.success({ title: 'Componente quitado' }),
                    onError: (err) => sileo.error({ title: 'Error al quitar', description: mapSupabaseError(err) }),
                  })}
                  disabled={deleteMutation.isPending && deleteMutation.variables === item.id}
                  title="Quitar componente"
                  className="shrink-0 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-30"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add form — solo admin, product_bundle_items es admin-only en RLS */}
      {isAdmin ? (
        <div className="flex flex-col gap-2.5 rounded-xl border border-border/50 bg-muted/20 p-3">
          <div className="flex flex-wrap items-end gap-2.5">
            <div className="flex flex-col gap-1 flex-1 min-w-40">
              <span className="text-[11px] font-medium text-muted-foreground">Producto</span>
              <ProductPicker
                value={productoId}
                onChange={setProductoId}
                excludeIds={[paqueteId]}
                excludeTipo="paquete"
                addedIds={items.map((i) => i.producto_id)}
              />
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-muted-foreground">Cantidad</span>
              <Input
                type="number"
                min={1}
                step={1}
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                className="h-9 w-20 text-sm"
              />
            </div>

            <Button
              type="button"
              size="sm"
              onClick={handleAdd}
              disabled={!productoId || !Number.isInteger(Number(cantidad)) || Number(cantidad) < 1 || isPending}
              className="h-9"
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : existingItem ? (
                <CopyPlus className="h-3.5 w-3.5" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              {existingItem ? 'Sumar cantidad' : 'Agregar'}
            </Button>
          </div>

          {existingItem && (
            <p className="text-xs text-accent flex items-center gap-1">
              Ya está en el paquete ×{existingItem.cantidad} — se sumará a {existingItem.cantidad + (Number(cantidad) || 0)}.
            </p>
          )}
        </div>
      ) : (
        items.length === 0 && (
          <p className="text-xs text-muted-foreground">Sin componentes todavía.</p>
        )
      )}
    </div>
  )
}
