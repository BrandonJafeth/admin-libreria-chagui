import { createFileRoute } from '@tanstack/react-router'
import { useCategories } from '@/features/categories/hooks/useCategories'
import { CategoryTable } from '@/features/categories/components/CategoryTable'
import { Skeleton } from '@/components/ui/skeleton'
import { mapSupabaseError } from '@/lib/errors'

export const Route = createFileRoute('/_authenticated/categorias/')({
  staticData: { breadcrumb: 'Categorías' },
  component: CategoriasPage,
})

function CategoriasPage() {
  const { data: categories, isLoading, error } = useCategories()

  if (error) {
    return <p className="text-destructive text-sm">Error: {mapSupabaseError(error)}</p>
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-xl" />
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-2.5 w-32" />
            </div>
          </div>
          <Skeleton className="h-8 w-32 rounded-lg" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-15 rounded-xl" style={{ opacity: 1 - i * 0.15 }} />
          ))}
        </div>
      </div>
    )
  }

  return <CategoryTable categories={categories ?? []} />
}
