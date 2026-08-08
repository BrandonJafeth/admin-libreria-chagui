import { useState } from 'react'
import { Pencil, Trash2, Plus, Gift as GiftIcon, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { GiftForm, type GiftFormValues } from './GiftForm'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useCreateGift, useUpdateGift, useDeleteGift } from '../hooks/useGiftMutations'
import type { GiftListItem } from '../api/gifts.api'
import { useRouteContext } from '@tanstack/react-router'
import { sileo } from 'sileo'
import { mapSupabaseError } from '@/lib/errors'

function formatFecha(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function EmptyState({ onAdd }: { onAdd?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-16 w-16 rounded-2xl bg-accent/8 border border-accent/10 flex items-center justify-center mb-5">
        <GiftIcon className="h-7 w-7 text-accent/40" />
      </div>
      <p className="font-heading font-semibold text-foreground text-sm">Sin regalías</p>
      <p className="text-xs text-muted-foreground mt-1.5 mb-5 max-w-64 leading-relaxed">
        Crea una regla para regalar un producto automáticamente al comprar otro.
      </p>
      {onAdd && (
        <Button size="sm" onClick={onAdd}>
          <Plus className="h-4 w-4" />
          Crear primera regalía
        </Button>
      )}
    </div>
  )
}

function GiftRow({
  gift,
  onEdit,
  onDelete,
  isDeleting,
  isAdmin,
}: {
  gift: GiftListItem
  onEdit: () => void
  onDelete: () => void
  isDeleting: boolean
  isAdmin: boolean
}) {
  const rango = gift.fecha_inicio || gift.fecha_fin
    ? `${formatFecha(gift.fecha_inicio)}${gift.fecha_inicio && gift.fecha_fin ? ' – ' : ''}${formatFecha(gift.fecha_fin)}`
    : null

  return (
    <div className="group flex items-center gap-3 rounded-xl px-4 py-3.5 bg-card border border-border/60 transition-all duration-150 hover:border-border hover:shadow-sm">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <span className="truncate">{gift.producto_disparador?.nombre ?? '—'}</span>
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">
            {gift.producto_regalo?.nombre ?? '—'}
            {gift.cantidad_regalo > 1 && <span className="text-muted-foreground"> ×{gift.cantidad_regalo}</span>}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{gift.mensaje}</p>
        {rango && <p className="text-[10.5px] text-muted-foreground/70 mt-0.5">{rango}</p>}
      </div>

      <Badge variant={gift.activo ? 'success' : 'warning'} className="shrink-0">
        {gift.activo ? 'Activa' : 'Inactiva'}
      </Badge>

      <div className="flex items-center gap-0.5 shrink-0">
        {isAdmin && (
          <button
            onClick={onEdit}
            aria-label="Editar regalía"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
        {isAdmin && (
          <button
            onClick={onDelete}
            disabled={isDeleting}
            aria-label="Eliminar regalía"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-colors disabled:opacity-30"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

interface GiftTableProps {
  gifts: GiftListItem[]
}

export function GiftTable({ gifts }: GiftTableProps) {
  const { userRole } = useRouteContext({ from: '/_authenticated' })
  const isAdmin = userRole === 'admin'
  const [editing, setEditing] = useState<GiftListItem | null>(null)
  const [creating, setCreating] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const createMutation = useCreateGift()
  const updateMutation = useUpdateGift()
  const deleteMutation = useDeleteGift()

  async function handleCreate(values: GiftFormValues) {
    try {
      await createMutation.mutateAsync(values)
      setCreating(false)
      sileo.success({ title: 'Regalía creada' })
    } catch (err) {
      sileo.error({ title: 'Error al crear', description: mapSupabaseError(err) })
    }
  }

  async function handleUpdate(values: GiftFormValues) {
    if (!editing) return
    try {
      await updateMutation.mutateAsync({ id: editing.id, updates: values })
      setEditing(null)
      sileo.success({ title: 'Regalía guardada' })
    } catch (err) {
      sileo.error({ title: 'Error al guardar', description: mapSupabaseError(err) })
    }
  }

  async function confirmDelete() {
    if (!pendingDeleteId) return
    try {
      await deleteMutation.mutateAsync(pendingDeleteId)
      setPendingDeleteId(null)
      sileo.success({ title: 'Regalía eliminada' })
    } catch (err) {
      sileo.error({ title: 'Error al eliminar', description: mapSupabaseError(err) })
    }
  }

  const pendingDeleteLabel = gifts.find((g) => g.id === pendingDeleteId)
  const pendingDeleteName = pendingDeleteLabel
    ? `${pendingDeleteLabel.producto_disparador?.nombre ?? '—'} → ${pendingDeleteLabel.producto_regalo?.nombre ?? '—'}`
    : ''

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 border border-accent/10">
            <GiftIcon className="h-4 w-4 text-accent" />
          </div>
          <p className="text-sm font-semibold text-foreground leading-none">
            {gifts.length === 0 ? 'Sin regalías' : `${gifts.length} regalía${gifts.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setCreating(true)} size="sm">
            <Plus className="h-4 w-4" />
            Nueva regalía
          </Button>
        )}
      </div>

      {gifts.length === 0 ? (
        <EmptyState onAdd={isAdmin ? () => setCreating(true) : undefined} />
      ) : (
        <div className="space-y-2">
          {gifts.map((gift) => (
            <GiftRow
              key={gift.id}
              gift={gift}
              onEdit={() => setEditing(gift)}
              onDelete={() => setPendingDeleteId(gift.id)}
              isDeleting={deleteMutation.isPending && deleteMutation.variables === gift.id}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}

      <Sheet
        open={creating}
        onOpenChange={(open) => {
          if (!open) createMutation.reset()
          setCreating(open)
        }}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Nueva regalía</SheetTitle>
            <SheetDescription>Al comprar el producto disparador, se agrega el regalo gratis.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <GiftForm
              onSubmit={handleCreate}
              onCancel={() => setCreating(false)}
              isLoading={createMutation.isPending}
              apiError={createMutation.isError ? mapSupabaseError(createMutation.error) : undefined}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) updateMutation.reset()
          if (!open) setEditing(null)
        }}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Editar regalía</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {editing && (
              <GiftForm
                defaultValues={editing}
                onSubmit={handleUpdate}
                onCancel={() => setEditing(null)}
                isLoading={updateMutation.isPending}
                apiError={updateMutation.isError ? mapSupabaseError(updateMutation.error) : undefined}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!pendingDeleteId}
        onOpenChange={(o) => !o && setPendingDeleteId(null)}
        title={`¿Eliminar "${pendingDeleteName}"?`}
        description="Esta acción no se puede deshacer."
        onConfirm={confirmDelete}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
