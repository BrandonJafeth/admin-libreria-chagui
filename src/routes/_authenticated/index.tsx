import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Package, PackageX, Tag } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const Route = createFileRoute('/_authenticated/')({
  staticData: { breadcrumb: 'Dashboard' },
  component: DashboardPage,
})

async function fetchSummary() {
  const [products, agotados, categories] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('estado', 'agotado'),
    supabase.from('categories').select('id', { count: 'exact', head: true }),
  ])
  return {
    totalProducts: products.count ?? 0,
    agotados: agotados.count ?? 0,
    totalCategories: categories.count ?? 0,
  }
}

function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: fetchSummary,
  })

  const stats = [
    {
      label: 'Productos',
      value: data?.totalProducts ?? '—',
      icon: Package,
      description: 'en catálogo',
    },
    {
      label: 'Agotados',
      value: data?.agotados ?? '—',
      icon: PackageX,
      description: 'sin stock',
    },
    {
      label: 'Categorías',
      value: data?.totalCategories ?? '—',
      icon: Tag,
      description: 'activas',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Resumen del catálogo de Librería Chaguí
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, description }) => (
          <Card key={label} className={isLoading ? 'opacity-60' : ''}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-heading font-bold text-foreground">
                {value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
