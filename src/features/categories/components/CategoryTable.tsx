import { useState, useEffect, useRef } from 'react'
import { Pencil, Trash2, GripVertical, Plus, ChevronUp, ChevronDown } from 'lucide-react'
import {
  draggable,
  dropTargetForElements,
  monitorForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import type { Category } from '../api/categories.api'
import { cn } from '@/lib/utils'

type DragState = 'idle' | 'dragging' | 'over'

function DraggableRow({
  cat,
  isFirst,
  isLast,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  isDeleting,
}: {
  cat: Category
  isFirst: boolean
  isLast: boolean
  onEdit: () => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  isDeleting: boolean
}) {
  const rowRef = useRef<HTMLTableRowElement>(null)
  const handleRef = useRef<HTMLButtonElement>(null)
  const [dragState, setDragState] = useState<DragState>('idle')

  useEffect(() => {
    const row = rowRef.current
    const handle = handleRef.current
    if (!row || !handle) return

    const cleanupDrag = draggable({
      element: row,
      dragHandle: handle,
      getInitialData: () => ({ id: cat.id }),
      onDragStart: () => setDragState('dragging'),
      onDrop: () => setDragState('idle'),
    })

    const cleanupDrop = dropTargetForElements({
      element: row,
      getData: () => ({ id: cat.id }),
      onDragEnter: () => setDragState('over'),
      onDragLeave: () => setDragState('idle'),
      onDrop: () => setDragState('idle'),
    })

    return () => {
      cleanupDrag()
      cleanupDrop()
    }
  }, [cat.id])

  return (
    <TableRow
      ref={rowRef}
      className={cn(
        'transition-colors',
        dragState === 'dragging' && 'opacity-40',
        dragState === 'over' && 'bg-accent/10',
      )}
    >
      <TableCell className="w-10 pr-0">
        {/* Desktop/Android: drag handle */}
        <button
          ref={handleRef}
          aria-label="Arrastrar para reordenar"
          className="touch-none hidden sm:flex items-center justify-center p-2 rounded cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground min-h-11 min-w-11"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        {/* Mobile (iOS safe): up/down arrows */}
        <div className="flex sm:hidden flex-col items-center">
          <button
            onClick={onMoveUp}
            disabled={isFirst}
            aria-label="Mover arriba"
            className="flex items-center justify-center p-1.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 min-h-6 min-w-6"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={isLast}
            aria-label="Mover abajo"
            className="flex items-center justify-center p-1.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 min-h-6 min-w-6"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </TableCell>
      <TableCell className="font-medium">{cat.nombre}</TableCell>
      <TableCell className="hidden sm:table-cell font-mono text-xs text-muted-foreground">
        {cat.slug}
      </TableCell>
      <TableCell className="hidden md:table-cell w-20 text-muted-foreground text-sm">
        {cat.orden ?? '—'}
      </TableCell>
      <TableCell className="w-24">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            aria-label="Editar"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            disabled={isDeleting}
            className="text-destructive hover:text-destructive"
            aria-label="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

interface CategoryTableProps {
  categories: Category[]
}

export function CategoryTable({ categories }: CategoryTableProps) {
  const [localCats, setLocalCats] = useState<Category[]>(categories)
  const [editing, setEditing] = useState<Category | null>(null)
  const [creating, setCreating] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

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

  // Desktop drag-and-drop monitor (registered once, uses refs for fresh state)
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
      localCats.length > 0
        ? Math.max(...localCats.map((c) => c.orden ?? 0)) + 1
        : 1
    await createMutation.mutateAsync({ ...values, orden: nextOrden })
    setCreating(false)
  }

  async function handleUpdate(values: { nombre: string; slug: string }) {
    if (!editing) return
    await updateMutation.mutateAsync({ id: editing.id, updates: values })
    setEditing(null)
  }

  async function confirmDelete() {
    if (!pendingDeleteId) return
    await deleteMutation.mutateAsync(pendingDeleteId)
    setPendingDeleteId(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)} size="sm">
          <Plus className="h-4 w-4" />
          Nueva categoría
        </Button>
      </div>

      <div className="card-solid rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden sm:table-cell">Slug</TableHead>
                <TableHead className="hidden md:table-cell w-20">Orden</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {localCats.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-8"
                  >
                    Sin categorías. Crea la primera.
                  </TableCell>
                </TableRow>
              )}
              {localCats.map((cat, idx) => (
                <DraggableRow
                  key={cat.id}
                  cat={cat}
                  isFirst={idx === 0}
                  isLast={idx === localCats.length - 1}
                  onEdit={() => setEditing(cat)}
                  onDelete={() => setPendingDeleteId(cat.id)}
                  onMoveUp={() => moveCategory(cat.id, 'up')}
                  onMoveDown={() => moveCategory(cat.id, 'down')}
                  isDeleting={deleteMutation.isPending}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create sheet */}
      <Sheet open={creating} onOpenChange={setCreating}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Nueva categoría</SheetTitle>
            <SheetDescription>
              Completa los campos para crear una nueva categoría.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <CategoryForm
              onSubmit={handleCreate}
              onCancel={() => setCreating(false)}
              isLoading={createMutation.isPending}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!pendingDeleteId}
        onOpenChange={(o) => !o && setPendingDeleteId(null)}
        title="¿Eliminar categoría?"
        description="Los productos vinculados quedan sin esta categoría. Esta acción no se puede deshacer."
        onConfirm={confirmDelete}
        isLoading={deleteMutation.isPending}
      />

      {/* Edit sheet */}
      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Editar categoría</SheetTitle>
            <SheetDescription className="font-mono text-xs">
              {editing?.slug}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {editing && (
              <CategoryForm
                defaultValues={editing}
                onSubmit={handleUpdate}
                onCancel={() => setEditing(null)}
                isLoading={updateMutation.isPending}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
