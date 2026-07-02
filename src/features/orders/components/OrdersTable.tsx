import { useState } from 'react'
import { ShoppingCart, Package, Loader2, Eye, Phone, ChevronDown, Check } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/animate-ui/components/radix/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { formatPrice, cn } from '@/lib/utils'
import { mapSupabaseError } from '@/lib/errors'
import { useOrders, useOrder } from '../hooks/useOrders'
import { useUpdateOrderStatus } from '../hooks/useOrderMutations'
import type { OrderListItem, OrderStatus } from '../api/orders.api'
import { sileo } from 'sileo'

type StatusFilter = 'pendiente' | 'all'

const STATUS_META: Record<OrderStatus, { label: string; variant: 'warning' | 'success' | 'destructive'; dot: string }> = {
  pendiente: { label: 'Pendiente', variant: 'warning', dot: 'bg-accent-3' },
  confirmado: { label: 'Confirmado', variant: 'success', dot: 'bg-green-500' },
  cancelado: { label: 'Cancelado', variant: 'destructive', dot: 'bg-destructive' },
}
const STATUS_ORDER: OrderStatus[] = ['pendiente', 'confirmado', 'cancelado']

// ─── Status control (inline row dropdown + optional cancel note) ──────────────

function StatusSelect({ order }: { order: OrderListItem }) {
  const updateMutation = useUpdateOrderStatus()
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelNote, setCancelNote] = useState('')

  const busy = updateMutation.isPending && updateMutation.variables?.id === order.id

  function applyStatus(status: OrderStatus, notes?: string) {
    updateMutation.mutate(
      { id: order.id, status, notes },
      {
        onSuccess: () => sileo.success({ title: 'Estado actualizado' }),
        onError: (err) => sileo.error({ title: 'Error al actualizar estado', description: mapSupabaseError(err) }),
      },
    )
  }

  function handleSelect(status: OrderStatus) {
    if (status === order.status) return
    if (status === 'cancelado') {
      setCancelNote('')
      setCancelOpen(true)
      return
    }
    applyStatus(status)
  }

  function confirmCancel() {
    applyStatus('cancelado', cancelNote.trim() || undefined)
    setCancelOpen(false)
  }

  const meta = STATUS_META[order.status]

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={busy}>
          <button type="button" disabled={busy} className="inline-flex items-center disabled:opacity-60">
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            ) : (
              <Badge variant={meta.variant} className="cursor-pointer gap-1 hover:opacity-80 transition-opacity">
                <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
                {meta.label}
                <ChevronDown className="h-3 w-3 opacity-60" />
              </Badge>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40">
          {STATUS_ORDER.map((status) => (
            <DropdownMenuItem key={status} onClick={() => handleSelect(status)} className="gap-2">
              <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_META[status].dot)} />
              {STATUS_META[status].label}
              {status === order.status && <Check className="ml-auto h-3.5 w-3.5 text-muted-foreground" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancelar pedido</DialogTitle>
            <DialogDescription>
              Podés agregar una nota con el motivo — es opcional, se puede dejar en blanco.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={cancelNote}
            onChange={(e) => setCancelNote(e.target.value)}
            placeholder="Motivo de la cancelación (opcional)"
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              Volver
            </Button>
            <Button variant="destructive" onClick={confirmCancel} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Cancelando…' : 'Confirmar cancelación'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Detail sheet ───────────────────────────────────────────────────────────────

function OrderDetailSheet({ orderId, onOpenChange }: { orderId: string | null; onOpenChange: (open: boolean) => void }) {
  const { data: order, isLoading, error } = useOrder(orderId ?? '', !!orderId)

  return (
    <Sheet open={!!orderId} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Detalle del pedido</SheetTitle>
          <SheetDescription>Productos, cantidades y total enviados por el cliente.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          )}

          {error && <p className="text-sm text-destructive">{mapSupabaseError(error)}</p>}

          {order && (
            <>
              <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1">
                <p className="text-sm font-semibold text-foreground">{order.customer_name}</p>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" /> {order.customer_phone}
                </p>
                {order.notes && (
                  <p className="text-xs text-muted-foreground mt-1.5 italic">{order.notes}</p>
                )}
              </div>

              <div className="space-y-2">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-3 rounded-lg border border-border/60 p-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.product_nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.cantidad} × {formatPrice(item.precio_unitario)}
                        {item.color ? ` · ${item.color}` : ''}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-accent shrink-0">{formatPrice(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="text-sm font-semibold text-foreground">Total</span>
                <span className="text-base font-bold text-accent">{formatPrice(order.total)}</span>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function OrdersTable() {
  const [filter, setFilter] = useState<StatusFilter>('pendiente')
  const [viewingId, setViewingId] = useState<string | null>(null)

  const { data: orders, isLoading, error } = useOrders(
    filter === 'pendiente' ? { status: 'pendiente' } : undefined,
  )

  const pendingCount = orders?.filter((o) => o.status === 'pendiente').length ?? 0

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10">
            <ShoppingCart className="h-4 w-4 text-accent" />
          </div>
          <div>
            <h1 className="font-heading text-[17px] font-bold text-foreground tracking-[-0.3px] leading-tight">
              Pedidos
            </h1>
            <p className="text-[11.5px] text-muted-foreground mt-0.5">
              Pedidos enviados por clientes desde el carrito del sitio
            </p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 rounded-xl border border-border bg-muted/30 p-1">
          <button
            onClick={() => setFilter('pendiente')}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
              filter === 'pendiente'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Pendientes
            {pendingCount > 0 && filter !== 'pendiente' && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-white">
                {pendingCount > 9 ? '9+' : pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilter('all')}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
              filter === 'all'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Todos
          </button>
        </div>
      </div>

      {/* ── Error ── */}
      {error && <p className="text-sm text-destructive">{mapSupabaseError(error)}</p>}

      {/* ── Loading skeleton ── */}
      {isLoading && (
        <div className="card-solid rounded-xl overflow-hidden">
          <Skeleton className="h-10 rounded-none" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-none border-t border-border" />
          ))}
        </div>
      )}

      {/* ── Empty state ── */}
      {!isLoading && !error && orders?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ShoppingCart className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm font-medium">
            {filter === 'pendiente' ? 'Sin pedidos pendientes' : 'Sin pedidos aún'}
          </p>
          <p className="text-muted-foreground/60 text-xs mt-1">
            Los pedidos hechos desde el carrito del sitio van a aparecer acá.
          </p>
        </div>
      )}

      {/* ── Table ── */}
      {!isLoading && orders && orders.length > 0 && (
        <div className="card-solid rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-40">Cliente</TableHead>
                  <TableHead className="w-32">Teléfono</TableHead>
                  <TableHead className="w-20">Items</TableHead>
                  <TableHead className="w-28">Total</TableHead>
                  <TableHead className="w-28">Fecha</TableHead>
                  <TableHead className="w-36">Estado</TableHead>
                  <TableHead className="w-16 text-right">Ver</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <span className="text-sm font-medium">{order.customer_name}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">{order.customer_phone}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Package className="h-3.5 w-3.5 text-muted-foreground/50" />
                        <span className="text-sm">{order.order_items.length}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-semibold text-accent">{formatPrice(order.total)}</span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString('es-CR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusSelect order={order} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end">
                        <Button variant="ghost" size="icon" onClick={() => setViewingId(order.id)} title="Ver detalle">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <OrderDetailSheet orderId={viewingId} onOpenChange={(o) => !o && setViewingId(null)} />
    </div>
  )
}
