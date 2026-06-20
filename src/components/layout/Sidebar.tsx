import { Link } from '@tanstack/react-router'
import {
  LayoutDashboard,
  Package,
  Tag,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store/ui-store'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/productos', icon: Package, label: 'Productos', exact: false },
  { to: '/categorias', icon: Tag, label: 'Categorías', exact: false },
] as const

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, sidebarMobileOpen, setSidebarMobileOpen } = useUIStore()

  return (
    <>
      {/* Mobile overlay */}
      {sidebarMobileOpen && (
        <div
          className="fixed inset-0 z-39 bg-black/50 lg:hidden"
          onClick={() => setSidebarMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col bg-sidebar border-r border-border transition-all duration-200',
          // Mobile: slide in/out. Desktop: always visible.
          sidebarMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          // Width: mobile always 256px (slides as drawer). Desktop collapses.
          sidebarCollapsed ? 'w-64 lg:w-16' : 'w-64 lg:w-56',
        )}
      >
        {/* Brand */}
        <div className="flex h-14 items-center justify-between px-4 border-b border-border">
          <span
            className={cn(
              'font-heading font-semibold text-foreground truncate',
              sidebarCollapsed && 'lg:hidden',
            )}
          >
            Librería Chaguí
          </span>
          <button
            onClick={() => setSidebarMobileOpen(false)}
            className="lg:hidden p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {navItems.map(({ to, icon: Icon, label, exact }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact }}
              onClick={() => setSidebarMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                sidebarCollapsed && 'lg:justify-center lg:px-2',
              )}
              activeProps={{ className: 'bg-primary/8 text-primary hover:bg-primary/12 hover:text-primary' }}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className={cn(sidebarCollapsed && 'lg:hidden')}>{label}</span>
            </Link>
          ))}
        </nav>

        {/* Collapse toggle — desktop only */}
        <div className="hidden lg:block p-2 border-t border-border">
          <button
            onClick={toggleSidebar}
            className="flex w-full items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title={sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>
      </aside>
    </>
  )
}
