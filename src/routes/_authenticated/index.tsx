import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Package, PackageX, Tag } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

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

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string
  value: number | string
  meta: string
  icon: React.ElementType
  tone?: 'accent' | 'blue' | 'amber'
  loading?: boolean
}

function KpiCard({ label, value, meta, icon: Icon, tone = 'accent', loading }: KpiCardProps) {
  const numberColor = {
    accent: 'text-accent',
    blue: 'text-accent-2',
    amber: 'text-accent-3',
  }[tone]

  const ruleColor = {
    accent: 'bg-accent',
    blue: 'bg-accent-2',
    amber: 'bg-accent-3',
  }[tone]

  return (
    <div
      className={cn(
        'relative bg-card border border-border rounded-xl overflow-hidden group cursor-default',
        'shadow-[0_1px_4px_rgba(0,0,0,0.04)]',
        'transition-all duration-200 hover:-translate-y-px hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)]',
        loading && 'opacity-60',
      )}
    >
      {/* Top accent sweep on hover */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 h-0.5 scale-x-0 group-hover:scale-x-100',
          'transition-transform duration-300 origin-left',
          ruleColor,
        )}
      />

      <div className="p-5">
        <p className="text-[10.5px] font-semibold tracking-[0.9px] uppercase text-muted-foreground mb-3 select-none">
          {label}
        </p>

        <p
          className={cn(
            'font-heading text-[40px] font-bold leading-none tracking-[-2px]',
            numberColor,
            loading && 'animate-pulse',
          )}
        >
          {loading ? '—' : value}
        </p>

        <p className="text-[11px] text-muted-foreground mt-2.5">{meta}</p>
      </div>

      {/* Background icon watermark */}
      <Icon
        className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 text-foreground opacity-[0.04] pointer-events-none"
        strokeWidth={1.5}
      />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: fetchSummary,
  })

  return (
    <div className="space-y-7">
      {/* Page header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-heading text-[22px] font-bold text-foreground tracking-[-0.4px] leading-tight">
            Panel de Control
          </h1>
          <p className="text-[11.5px] text-muted-foreground mt-1 tracking-[0.1px]">
            Resumen del catálogo · Librería &amp; Bazar Chaguí
          </p>
        </div>
        <p className="text-[10.5px] text-muted-foreground font-medium tracking-[0.3px] opacity-70 hidden sm:block">
          {new Date().toLocaleDateString('es-CR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="Productos Activos"
          value={data?.totalProducts ?? 0}
          meta="en catálogo"
          icon={Package}
          tone="accent"
          loading={isLoading}
        />
        <KpiCard
          label="Agotados"
          value={data?.agotados ?? 0}
          meta="sin stock"
          icon={PackageX}
          tone="amber"
          loading={isLoading}
        />
        <KpiCard
          label="Categorías"
          value={data?.totalCategories ?? 0}
          meta="activas"
          icon={Tag}
          tone="blue"
          loading={isLoading}
        />
      </div>
    </div>
  )
}
