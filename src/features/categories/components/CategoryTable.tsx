import { useState } from 'react'
import { Pencil, Trash2, GripVertical, Plus } from 'lucide-react'
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
import {
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '../hooks/useCategoryMutations'
import type { Category } from '../api/categories.api'

interface CategoryTableProps {
  categories: Category[]
}

export function CategoryTable({ categories }: CategoryTableProps) {
  const [editing, setEditing] = useState<Category | null>(null)
  const [creating, setCreating] = useState(false)

  const createMutation = useCreateCategory()
  const updateMutation = useUpdateCategory()
  const deleteMutation = useDeleteCategory()

  async function handleCreate(values: { nombre: string; slug: string; orden: number }) {
    await createMutation.mutateAsync(values)
    setCreating(false)
  }

  async function handleUpdate(values: { nombre: string; slug: string; orden: number }) {
    if (!editing) return
    await updateMutation.mutateAsync({ id: editing.id, updates: values })
    setEditing(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta categoría? Los productos vinculados quedan sin esa categoría.'))
      return
    await deleteMutation.mutateAsync(id)
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
              <TableHead className="w-8"></TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="w-20">Orden</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Sin categorías. Crea la primera.
                </TableCell>
              </TableRow>
            )}
            {categories.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell className="text-muted-foreground">
                  <GripVertical className="h-4 w-4" />
                </TableCell>
                <TableCell className="font-medium">{cat.nombre}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {cat.slug}
                </TableCell>
                <TableCell className="text-muted-foreground">{cat.orden}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditing(cat)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(cat.id)}
                      disabled={deleteMutation.isPending}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
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
            <SheetDescription>Completa los campos para crear una nueva categoría.</SheetDescription>
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

      {/* Edit sheet */}
      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Editar categoría</SheetTitle>
            <SheetDescription className="font-mono text-xs">{editing?.slug}</SheetDescription>
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
