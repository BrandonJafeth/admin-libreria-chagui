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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-muted animate-pulse" />
            <div className="space-y-1.5">
              <div className="h-3.5 w-24 rounded bg-muted animate-pulse" />
              <div className="h-2.5 w-32 rounded bg-muted animate-pulse" />
            </div>
          </div>
          <div className="h-8 w-32 rounded-lg bg-muted animate-pulse" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-15 rounded-xl bg-muted animate-pulse" style={{ opacity: 1 - i * 0.15 }} />
          ))}
        </div>
      </div>
    )
  }

  return <CategoryTable categories={categories ?? []} />
}
