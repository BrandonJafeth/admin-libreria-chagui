import { useState, useEffect, useRef } from 'react'
import { Pencil, Trash2, GripVertical, Plus, ChevronUp, ChevronDown, Tag, FolderOpen } from 'lucide-react'
import {
  draggable,
  dropTargetForElements,
  monitorForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { CategoryForm } from './CategoryForm'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useReorderCategories,
} from '../hooks/useCategoryMutations'
import { fetchCategoryProductCount, type Category } from '../api/categories.api'
import { useRouteContext } from '@tanstack/react-router'
import { sileo } from 'sileo'
import { cn } from '@/lib/utils'

type DragState = 'idle' | 'dragging' | 'over'

// ─── Category Card ─────────────────────────────────────────────────────────────

function CategoryCard({
  cat,
  index,
  total,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  isDeleting,
  isAdmin,
}: {
  cat: Category
  index: number
  total: number
  onEdit: () => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  isDeleting: boolean
  isAdmin: boolean
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const handleRef = useRef<HTMLButtonElement>(null)
  const [dragState, setDragState] = useState<DragState>('idle')

  useEffect(() => {
    const el = cardRef.current
    const handle = handleRef.current
    if (!el || !handle) return

    const c1 = draggable({
      element: el,
      dragHandle: handle,
      getInitialData: () => ({ id: cat.id }),
      onDragStart: () => setDragState('dragging'),
      onDrop: () => setDragState('idle'),
    })
    const c2 = dropTargetForElements({
      element: el,
      getData: () => ({ id: cat.id }),
      onDragEnter: () => setDragState('over'),
      onDragLeave: () => setDragState('idle'),
      onDrop: () => setDragState('idle'),
    })
    return () => { c1(); c2() }
  }, [cat.id])

  const orderNum = String(index + 1).padStart(2, '0')

  return (
    <div
      ref={cardRef}
      className={cn(
        'group relative flex items-center gap-3 rounded-xl px-4 py-3.5',
        'bg-card border border-border/60',
        'transition-all duration-150 select-none',
        'hover:border-border hover:shadow-sm hover:-translate-y-px',
        dragState === 'dragging' && 'opacity-30 scale-[0.98] shadow-none translate-y-0',
        dragState === 'over' && 'ring-2 ring-accent border-transparent bg-accent/3 translate-y-0',
      )}
    >
      {/* Left accent bar */}
      <div
        className={cn(
          'absolute left-0 top-3 bottom-3 w-0.75 rounded-full bg-accent',
          'origin-center transition-transform duration-200',
          dragState === 'over' ? 'scale-y-100' : 'scale-y-0 group-hover:scale-y-100',
        )}
      />

      {/* Mobile: up/down arrows */}
      <div className="flex sm:hidden flex-col gap-0 shrink-0">
        <button
          onClick={onMoveUp}
          disabled={index === 0}
          aria-label="Mover arriba"
          className="flex items-center justify-center w-5 h-5 rounded text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
        >
          <ChevronUp className="h-3 w-3" />
        </button>
        <button
          onClick={onMoveDown}
          disabled={index === total - 1}
          aria-label="Mover abajo"
          className="flex items-center justify-center w-5 h-5 rounded text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
        >
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>

      {/* Desktop: drag handle */}
      <button
        ref={handleRef}
        aria-label="Arrastrar para reordenar"
        className={cn(
          'hidden sm:flex touch-none items-center justify-center',
          'w-6 h-8 rounded text-muted-foreground/40 hover:text-muted-foreground',
          'cursor-grab active:cursor-grabbing transition-all duration-150 shrink-0',
          'opacity-0 group-hover:opacity-100',
        )}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Order number */}
      <span className="font-mono text-base font-bold tabular-nums leading-none w-7 shrink-0 text-accent/50 group-hover:text-accent transition-colors duration-150">
        {orderNum}
      </span>

      {/* Divider */}
      <div className="h-8 w-px bg-border/50 shrink-0" />

      {/* Name + slug */}
      <div className="flex-1 min-w-0">
        <p className="font-heading font-semibold text-sm text-foreground truncate leading-snug">
          {cat.nombre}
        </p>
        <p className="font-mono text-[10.5px] text-muted-foreground/60 truncate leading-snug mt-0.5">
          /{cat.slug}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 shrink-0 transition-opacity duration-150 sm:opacity-0 sm:group-hover:opacity-100">
        <button
          onClick={onEdit}
          aria-label="Editar categoría"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        {isAdmin && (
          <button
            onClick={onDelete}
            disabled={isDeleting}
            aria-label="Eliminar categoría"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-colors disabled:opacity-30"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Empty State ───────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="relative mb-5">
        <div className="h-16 w-16 rounded-2xl bg-accent/8 border border-accent/10 flex items-center justify-center">
          <FolderOpen className="h-7 w-7 text-accent/40" />
        </div>
        <div className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-background border-2 border-border flex items-center justify-center shadow-sm">
          <Plus className="h-3 w-3 text-muted-foreground" />
        </div>
      </div>
      <p className="font-heading font-semibold text-foreground text-sm">Sin categorías</p>
      <p className="text-xs text-muted-foreground mt-1.5 mb-5 max-w-50 leading-relaxed">
        Crea categorías para organizar el catálogo de productos.
      </p>
      {onAdd && (
        <Button size="sm" onClick={onAdd}>
          <Plus className="h-4 w-4" />
          Crear primera categoría
        </Button>
      )}
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

interface CategoryTableProps {
  categories: Category[]
}

export function CategoryTable({ categories }: CategoryTableProps) {
  const { userRole } = useRouteContext({ from: '/_authenticated' })
  const isAdmin = userRole === 'admin'
  const [localCats, setLocalCats] = useState<Category[]>(categories)
  const [editing, setEditing] = useState<Category | null>(null)
  const [creating, setCreating] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [linkedCount, setLinkedCount] = useState<number | null>(null)
  const [checkingLinks, setCheckingLinks] = useState(false)

  const localCatsRef = useRef(localCats)
  localCatsRef.current = localCats

  const createMutation = useCreateCategory()
  const updateMutation = useUpdateCategory()
  const deleteMutation = useDeleteCategory()
  const reorderMutation = useReorderCategories()
  const reorderRef = useRef(reorderMutation.mutate)
  reorderRef.current = reorderMutation.mutate

  useEffect(() => {
    setLocalCats(categories)
  }, [categories])

  useEffect(() => {
    return monitorForElements({
      onDrop({ source, location }) {
        const dest = location.current.dropTargets[0]
        if (!dest) return
        const srcId = source.data.id as string
        const dstId = dest.data.id as string
        if (srcId === dstId) return
        const cats = localCatsRef.current
        const srcIdx = cats.findIndex((c) => c.id === srcId)
        const dstIdx = cats.findIndex((c) => c.id === dstId)
        if (srcIdx === -1 || dstIdx === -1) return
        const next = [...cats]
        const [moved] = next.splice(srcIdx, 1)
        next.splice(dstIdx, 0, moved)
        applyReorder(next)
      },
    })
  }, [])

  function applyReorder(next: Category[]) {
    const reordered = next.map((c, i) => ({ ...c, orden: i + 1 }))
    setLocalCats(reordered)
    reorderRef.current(reordered.map((c) => ({ id: c.id, orden: c.orden })))
  }

  function moveCategory(id: string, direction: 'up' | 'down') {
    const cats = localCatsRef.current
    const idx = cats.findIndex((c) => c.id === id)
    if (idx === -1) return
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === cats.length - 1) return
    const next = [...cats]
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    ;[next[idx], next[swapIdx]] = [next[swapIdx], next[idx]]
    applyReorder(next)
  }

  async function handleCreate(values: { nombre: string; slug: string }) {
    const nextOrden =
      localCats.length > 0 ? Math.max(...localCats.map((c) => c.orden ?? 0)) + 1 : 1
    try {
      await createMutation.mutateAsync({ ...values, orden: nextOrden })
      setCreating(false)
      sileo.success({ title: 'Categoría creada' })
    } catch (err) {
      sileo.error({ title: 'Error al crear', description: err instanceof Error ? err.message : 'Intenta de nuevo' })
    }
  }

  async function handleUpdate(values: { nombre: string; slug: string }) {
    if (!editing) return
    try {
      await updateMutation.mutateAsync({ id: editing.id, updates: values })
      setEditing(null)
      sileo.success({ title: 'Categoría guardada' })
    } catch (err) {
      sileo.error({ title: 'Error al guardar', description: err instanceof Error ? err.message : 'Intenta de nuevo' })
    }
  }

  async function handleDeleteClick(id: string) {
    setPendingDeleteId(id)
    setLinkedCount(null)
    setCheckingLinks(true)
    try {
      const count = await fetchCategoryProductCount(id)
      setLinkedCount(count)
    } catch {
      setLinkedCount(0)
    } finally {
      setCheckingLinks(false)
    }
  }

  function handleDeleteDialogClose() {
    setPendingDeleteId(null)
    setLinkedCount(null)
    deleteMutation.reset()
  }

  async function confirmDelete() {
    if (!pendingDeleteId) return
    try {
      await deleteMutation.mutateAsync(pendingDeleteId)
      setPendingDeleteId(null)
      setLinkedCount(null)
      sileo.success({ title: 'Categoría eliminada' })
    } catch (err) {
      sileo.error({ title: 'Error al eliminar', description: err instanceof Error ? err.message : 'Intenta de nuevo' })
    }
  }

  const pendingDeleteName = localCats.find((c) => c.id === pendingDeleteId)?.nombre ?? ''
  const isBlocked = linkedCount !== null && linkedCount > 0

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 border border-accent/10">
            <Tag className="h-4 w-4 text-accent" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-none">
              {localCats.length === 0
                ? 'Sin categorías'
                : `${localCats.length} categoría${localCats.length !== 1 ? 's' : ''}`}
            </p>
            {localCats.length > 1 && (
              <p className="text-[10.5px] text-muted-foreground leading-none mt-1">
                Arrastra para reordenar
              </p>
            )}
          </div>
        </div>
        {isAdmin && (
          <Button onClick={() => setCreating(true)} size="sm">
            <Plus className="h-4 w-4" />
            Nueva categoría
          </Button>
        )}
      </div>

      {/* ── Card list ── */}
      {localCats.length === 0 ? (
        <EmptyState onAdd={isAdmin ? () => setCreating(true) : undefined} />
      ) : (
        <div className="space-y-2">
          {localCats.map((cat, idx) => (
            <CategoryCard
              key={cat.id}
              cat={cat}
              index={idx}
              total={localCats.length}
              onEdit={() => setEditing(cat)}
              onDelete={() => handleDeleteClick(cat.id)}
              onMoveUp={() => moveCategory(cat.id, 'up')}
              onMoveDown={() => moveCategory(cat.id, 'down')}
              isDeleting={deleteMutation.isPending && deleteMutation.variables === cat.id}
              isAdmin={isAdmin}
            />
          ))}

          {/* Add at bottom — admin only */}
          {isAdmin && (
            <button
              onClick={() => setCreating(true)}
              className={cn(
                'w-full flex items-center justify-center gap-2 rounded-xl py-3',
                'border-2 border-dashed border-border/40 text-sm text-muted-foreground',
                'hover:border-accent/40 hover:text-accent',
                'transition-colors duration-150',
              )}
            >
              <Plus className="h-3.5 w-3.5" />
              Añadir categoría
            </button>
          )}
        </div>
      )}

      {/* ── Create sheet ── */}
      <Sheet
        open={creating}
        onOpenChange={(open) => {
          if (!open) createMutation.reset()
          setCreating(open)
        }}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Nueva categoría</SheetTitle>
            <SheetDescription>
              El slug se genera automáticamente desde el nombre.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <CategoryForm
              onSubmit={handleCreate}
              onCancel={() => setCreating(false)}
              isLoading={createMutation.isPending}
            />
            {createMutation.isError && (
              <p className="text-sm text-destructive mt-3">{createMutation.error.message}</p>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Edit sheet ── */}
      <Sheet
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) updateMutation.reset()
          if (!open) setEditing(null)
        }}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Editar categoría</SheetTitle>
            {editing && (
              <SheetDescription className="font-mono text-xs">
                /{editing.slug}
              </SheetDescription>
            )}
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {editing && (
              <>
                <CategoryForm
                  defaultValues={editing}
                  onSubmit={handleUpdate}
                  onCancel={() => setEditing(null)}
                  isLoading={updateMutation.isPending}
                />
                {updateMutation.isError && (
                  <p className="text-sm text-destructive mt-3">{updateMutation.error.message}</p>
                )}
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Delete confirmation ── */}
      <ConfirmDialog
        open={!!pendingDeleteId}
        onOpenChange={(o) => !o && handleDeleteDialogClose()}
        title={
          isBlocked
            ? `No se puede eliminar "${pendingDeleteName}"`
            : `¿Eliminar "${pendingDeleteName}"?`
        }
        description={
          checkingLinks
            ? 'Verificando productos vinculados…'
            : isBlocked
              ? `Esta categoría está vinculada a ${linkedCount} producto${linkedCount !== 1 ? 's' : ''}. Desvincula los productos de esta categoría antes de eliminarla.`
              : 'Esta acción no se puede deshacer.'
        }
        confirmDisabled={checkingLinks || isBlocked}
        onConfirm={confirmDelete}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
