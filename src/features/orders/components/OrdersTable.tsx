import { useEffect, useMemo, useState } from 'react'
import { useRouteContext } from '@tanstack/react-router'
import { ShoppingCart, Package, Loader2, Eye, Phone, ChevronDown, Check, Pencil, Clock, CheckCircle2, XCircle, ListFilter, Trash2 } from 'lucide-react'
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
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { formatPrice, cn } from '@/lib/utils'
import { mapSupabaseError } from '@/lib/errors'
import { useOrders, useOrder } from '../hooks/useOrders'
import { useUpdateOrderStatus, useDeleteOrder } from '../hooks/useOrderMutations'
import type { OrderListItem, OrderStatus } from '../api/orders.api'
import { sileo } from 'sileo'

type StatusFilter = 'all' | OrderStatus

const STATUS_META: Record<
  OrderStatus,
  { label: string; variant: 'warning' | 'success' | 'destructive'; dot: string; icon: typeof Clock }
> = {
  pendiente: { label: 'Pendiente', variant: 'warning', dot: 'bg-accent-3', icon: Clock },
  confirmado: { label: 'Confirmado', variant: 'success', dot: 'bg-green-500', icon: CheckCircle2 },
  cancelado: { label: 'Cancelado', variant: 'destructive', dot: 'bg-destructive', icon: XCircle },
}
const STATUS_ORDER: OrderStatus[] = ['pendiente', 'confirmado', 'cancelado']

// ─── Status control (inline row dropdown + editable note) ─────────────────────

function StatusSelect({ order }: { order: OrderListItem }) {
  const updateMutation = useUpdateOrderStatus()
  // null = editing the note only, keeping current status
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null)
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
  const [noteDraft, setNoteDraft] = useState('')

  const busy = updateMutation.isPending && updateMutation.variables?.id === order.id

  function openNoteDialog(status: OrderStatus | null) {
    setPendingStatus(status)
    setNoteDraft(order.notes ?? '')
    setNoteDialogOpen(true)
  }

  function handleSelect(status: OrderStatus) {
    if (status === order.status) return
    openNoteDialog(status)
  }

  function confirmChange() {
    const targetStatus = pendingStatus ?? order.status
    const trimmed = noteDraft.trim()
    const noteUnchanged = trimmed === (order.notes ?? '').trim()

    // Note-only edit with nothing actually changed: skip the write entirely.
    if (pendingStatus === null && noteUnchanged) {
      setNoteDialogOpen(false)
      return
    }

    updateMutation.mutate(
      { id: order.id, status: targetStatus, notes: trimmed === '' ? null : trimmed },
      {
        onSuccess: () => sileo.success({ title: pendingStatus ? 'Estado actualizado' : 'Motivo actualizado' }),
        onError: (err) => sileo.error({ title: 'Error al actualizar', description: mapSupabaseError(err) }),
      },
    )
    setNoteDialogOpen(false)
  }

  const meta = STATUS_META[order.status]
  const isCancelTarget = pendingStatus === 'cancelado'
  const hadStalePrevCancelNote = pendingStatus && pendingStatus !== 'cancelado' && order.status === 'cancelado' && !!order.notes

  return (
    <>
      <div className="flex items-center gap-1">
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

        <Button
          variant="ghost"
          size="icon"
          className={cn('h-6 w-6 hover:text-foreground', order.notes ? 'text-accent-3' : 'text-muted-foreground/60')}
          title={order.notes ? `Nota: ${order.notes}` : 'Agregar motivo/nota'}
          disabled={busy}
          onClick={() => openNoteDialog(null)}
        >
          <Pencil className="h-3 w-3" />
        </Button>
      </div>

      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {isCancelTarget
                ? 'Cancelar pedido'
                : pendingStatus
                  ? `Cambiar a "${STATUS_META[pendingStatus].label}"`
                  : order.notes
                    ? 'Editar motivo / nota'
                    : 'Agregar motivo / nota'}
            </DialogTitle>
            <DialogDescription>
              {isCancelTarget
                ? 'Podés agregar el motivo de la cancelación — es opcional.'
                : 'Nota interna sobre el pedido — opcional, se puede dejar en blanco.'}
            </DialogDescription>
          </DialogHeader>
          {hadStalePrevCancelNote && (
            <p className="text-xs text-accent-3 bg-accent-3/10 rounded-md px-2.5 py-1.5">
              Este pedido tenía un motivo de cancelación anterior. Actualizalo o borralo si ya no aplica.
            </p>
          )}
          <Textarea
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            placeholder={isCancelTarget ? 'Motivo de la cancelación (opcional)' : 'Nota (opcional)'}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>
              Volver
            </Button>
            <Button
              variant={isCancelTarget ? 'destructive' : 'default'}
              onClick={confirmChange}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Guardando…' : isCancelTarget ? 'Confirmar cancelación' : 'Guardar'}
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
  const updateMutation = useUpdateOrderStatus()
  const [editingNote, setEditingNote] = useState(false)
  const [noteDraft, setNoteDraft] = useState('')

  useEffect(() => setEditingNote(false), [orderId])

  function startEditNote() {
    setNoteDraft(order?.notes ?? '')
    setEditingNote(true)
  }

  function saveNote() {
    if (!order) return
    const trimmed = noteDraft.trim()
    if (trimmed === (order.notes ?? '').trim()) {
      setEditingNote(false)
      return
    }
    updateMutation.mutate(
      { id: order.id, status: order.status, notes: trimmed === '' ? null : trimmed },
      {
        onSuccess: () => sileo.success({ title: 'Motivo actualizado' }),
        onError: (err) => sileo.error({ title: 'Error al actualizar', description: mapSupabaseError(err) }),
      },
    )
    setEditingNote(false)
  }

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

                {editingNote ? (
                  <div className="mt-2 space-y-2">
                    <Textarea
                      autoFocus
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      placeholder="Motivo / nota (opcional)"
                      rows={3}
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditingNote(false)}>
                        Cancelar
                      </Button>
                      <Button size="sm" onClick={saveNote} disabled={updateMutation.isPending}>
                        {updateMutation.isPending ? 'Guardando…' : 'Guardar'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-1.5 flex items-start justify-between gap-2">
                    {order.notes ? (
                      <p className="text-xs text-muted-foreground italic">{order.notes}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground/50 italic">Sin motivo/nota</p>
                    )}
                    <button
                      type="button"
                      onClick={startEditNote}
                      className="shrink-0 text-muted-foreground/60 hover:text-foreground"
                      title={order.notes ? 'Editar nota' : 'Agregar nota'}
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                  </div>
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
  const { userRole } = useRouteContext({ from: '/_authenticated' })
  const isAdmin = userRole === 'admin'
  const [filter, setFilter] = useState<StatusFilter>('pendiente')
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  // Fetch everything once; filter client-side so tab counts stay accurate for all statuses at once.
  const { data: allOrders, isLoading, error } = useOrders()
  const deleteMutation = useDeleteOrder()

  async function confirmDelete() {
    if (!pendingDeleteId) return
    try {
      await deleteMutation.mutateAsync(pendingDeleteId)
      setPendingDeleteId(null)
      sileo.success({ title: 'Pedido eliminado' })
    } catch (err) {
      sileo.error({ title: 'Error al eliminar', description: mapSupabaseError(err) })
    }
  }

  const counts = useMemo(() => {
    const base: Record<StatusFilter, number> = { all: allOrders?.length ?? 0, pendiente: 0, confirmado: 0, cancelado: 0 }
    for (const o of allOrders ?? []) base[o.status]++
    return base
  }, [allOrders])

  const orders = useMemo(
    () => (filter === 'all' ? allOrders : allOrders?.filter((o) => o.status === filter)),
    [allOrders, filter],
  )

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

        {/* Filter tabs — one per status so it's clear at a glance what's shown */}
        <div className="flex items-center gap-1 rounded-xl border border-border bg-muted/30 p-1 overflow-x-auto">
          {STATUS_ORDER.map((status) => {
            const meta = STATUS_META[status]
            const Icon = meta.icon
            const active = filter === status
            return (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={cn(
                  'flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                  active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className={cn('h-3.5 w-3.5', active ? 'text-accent' : 'text-muted-foreground/60')} />
                {meta.label}s
                <span
                  className={cn(
                    'flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold',
                    active ? 'bg-accent text-white' : 'bg-muted-foreground/15 text-muted-foreground',
                  )}
                >
                  {counts[status]}
                </span>
              </button>
            )
          })}
          <button
            onClick={() => setFilter('all')}
            className={cn(
              'flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
              filter === 'all' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <ListFilter className={cn('h-3.5 w-3.5', filter === 'all' ? 'text-accent' : 'text-muted-foreground/60')} />
            Todos
            <span
              className={cn(
                'flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold',
                filter === 'all' ? 'bg-accent text-white' : 'bg-muted-foreground/15 text-muted-foreground',
              )}
            >
              {counts.all}
            </span>
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
            {filter === 'all' ? 'Sin pedidos aún' : `Sin pedidos ${STATUS_META[filter].label.toLowerCase()}s`}
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
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setViewingId(order.id)} title="Ver detalle">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setPendingDeleteId(order.id)}
                            className="text-destructive hover:text-destructive"
                            title="Eliminar pedido"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
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

      <ConfirmDialog
        open={!!pendingDeleteId}
        onOpenChange={(o) => !o && setPendingDeleteId(null)}
        title={`¿Eliminar el pedido de "${allOrders?.find((o) => o.id === pendingDeleteId)?.customer_name ?? ''}"?`}
        description="Esta acción no se puede deshacer."
        onConfirm={confirmDelete}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
