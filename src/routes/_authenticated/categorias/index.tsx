import { createFileRoute } from '@tanstack/react-router'
import { useCategories } from '@/features/categories/hooks/useCategories'
import { CategoryTable } from '@/features/categories/components/CategoryTable'

export const Route = createFileRoute('/_authenticated/categorias/')({
  staticData: { breadcrumb: 'Categorías' },
  component: CategoriasPage,
})

function CategoriasPage() {
  const { data: categories, isLoading, error } = useCategories()

  if (error) {
    return <p className="text-destructive text-sm">Error: {error.message}</p>
  }

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-semibold text-foreground">Categorías</h1>
      {isLoading ? (
        <p className="text-muted-foreground text-sm">Cargando…</p>
      ) : (
        <CategoryTable categories={categories ?? []} />
      )}
    </div>
  )
}
