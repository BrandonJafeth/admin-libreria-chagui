import { Link, useMatchRoute, useRouteContext } from '@tanstack/react-router'
import {
  LayoutDashboard,
  Package,
  Tag,
  Users,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store/ui-store'
import { useAuth } from '@/features/auth/hooks/useAuth'

const baseNavGroups = [
  {
    label: 'Principal',
    adminOnly: false,
    items: [
      { to: '/' as const, icon: LayoutDashboard, label: 'Dashboard', exact: true },
    ],
  },
  {
    label: 'Catálogo',
    adminOnly: false,
    items: [
      { to: '/productos' as const, icon: Package, label: 'Productos', exact: false },
      { to: '/categorias' as const, icon: Tag, label: 'Categorías', exact: false },
      { to: '/resenas' as const, icon: MessageSquare, label: 'Reseñas', exact: false },
    ],
  },
  {
    label: 'Sistema',
    adminOnly: true,
    items: [
      { to: '/usuarios' as const, icon: Users, label: 'Usuarios', exact: false },
    ],
  },
]

// ─── Nav Item ─────────────────────────────────────────────────────────────────

interface NavItemProps {
  to: string
  icon: React.ElementType
  label: string
  exact: boolean
  collapsed: boolean
  onNavigate: () => void
}

function NavItem({ to, icon: Icon, label, exact, collapsed, onNavigate }: NavItemProps) {
  const matchRoute = useMatchRoute()
  const isActive = !!matchRoute({ to, fuzzy: !exact })

  return (
    <Link
      to={to}
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-2.5 py-[9px] border-l-[3px] transition-colors duration-150',
        'hover:bg-foreground/[0.035] hover:text-foreground',
        collapsed ? 'lg:justify-center lg:px-0 lg:py-2.5' : 'px-[17px]',
        isActive
          ? 'border-l-accent bg-accent/[0.06] text-accent font-semibold text-[11.5px] tracking-[0.65px] uppercase'
          : 'border-l-transparent text-foreground/50 font-medium text-[13px]',
      )}
    >
      <Icon className={cn('shrink-0', isActive ? 'h-[14px] w-[14px]' : 'h-[15px] w-[15px]')} />
      <span className={cn(collapsed && 'lg:hidden')}>{label}</span>
    </Link>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, sidebarMobileOpen, setSidebarMobileOpen } =
    useUIStore()
  const { user } = useAuth()
  const { userRole } = useRouteContext({ from: '/_authenticated' })
  const isAdmin = userRole === 'admin'
  const navGroups = baseNavGroups.filter((g) => !g.adminOnly || isAdmin)

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'AD'

  const displayName = user?.email?.split('@')[0] ?? 'Admin'

  return (
    <>
      {/* Mobile overlay */}
      {sidebarMobileOpen && (
        <div
          className="fixed inset-0 z-39 bg-black/40 lg:hidden"
          onClick={() => setSidebarMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col bg-background border-r border-border transition-all duration-200',
          sidebarMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          sidebarCollapsed ? 'w-64 lg:w-14' : 'w-64 lg:w-60',
        )}
      >
        {/* ── Brand ─────────────────────────────────── */}
        <div
          className={cn(
            'border-b border-border flex-shrink-0',
            sidebarCollapsed ? 'px-0 py-4 flex justify-center' : 'px-5 pt-[22px] pb-[18px]',
          )}
        >
          {/* Expanded brand */}
          <div className={cn(sidebarCollapsed && 'lg:hidden')}>
            <p className="text-[9px] font-semibold tracking-[1.8px] uppercase text-muted-foreground mb-1.5 select-none">
              Panel Administrativo
            </p>
            <div className="font-heading text-[18px] font-bold tracking-[3px] uppercase leading-none text-foreground select-none">
              CHA<span className="text-accent">GUI</span>
            </div>
            <div className="flex items-center gap-2 mt-[11px]">
              <div className="h-[2px] w-7 bg-accent flex-shrink-0" />
              <span className="text-[8.5px] font-semibold tracking-[1.6px] uppercase text-muted-foreground opacity-70 select-none">
                Librería &amp; Bazar
              </span>
            </div>
          </div>

          {/* Collapsed monogram */}
          <div className={cn('hidden font-heading text-[17px] font-bold tracking-[2px] select-none', sidebarCollapsed && 'lg:block')}>
            C<span className="text-accent">G</span>
          </div>

          {/* Mobile close */}
          <button
            onClick={() => setSidebarMobileOpen(false)}
            className={cn(
              'lg:hidden text-muted-foreground hover:text-foreground transition-colors p-1 ml-auto',
              sidebarCollapsed ? 'hidden' : 'flex',
            )}
            aria-label="Cerrar menú"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Nav ───────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-1">
              {/* Section label */}
              <p
                className={cn(
                  'px-5 pt-3 pb-1.5 text-[9.5px] font-semibold tracking-[1.4px] uppercase text-muted-foreground/60 select-none',
                  sidebarCollapsed && 'lg:hidden',
                )}
              >
                {group.label}
              </p>

              {group.items.map(({ to, icon, label, exact }) => (
                <NavItem
                  key={to}
                  to={to}
                  icon={icon}
                  label={label}
                  exact={exact}
                  collapsed={sidebarCollapsed}
                  onNavigate={() => setSidebarMobileOpen(false)}
                />
              ))}
            </div>
          ))}
        </nav>

        {/* ── Footer ────────────────────────────────── */}
        <div
          className={cn(
            'border-t border-border flex items-center gap-2.5 flex-shrink-0',
            sidebarCollapsed ? 'lg:justify-center lg:px-0 py-3.5' : 'px-4 py-3.5',
          )}
        >
          {/* Avatar */}
          <div className="w-[30px] h-[30px] rounded-full bg-accent flex items-center justify-center text-[11px] font-bold text-white tracking-wide shrink-0 select-none">
            {initials}
          </div>

          {/* Name + role */}
          <div className={cn('flex-1 min-w-0', sidebarCollapsed && 'lg:hidden')}>
            <p className="text-[12px] font-semibold text-foreground truncate capitalize">
              {displayName}
            </p>
            <p className="text-[10px] text-muted-foreground tracking-wide capitalize">
              {userRole === 'employee' ? 'Empleado' : 'Administrador'}
            </p>
          </div>

          {/* Collapse toggle — desktop only, visible when expanded */}
          <button
            onClick={toggleSidebar}
            className={cn(
              'hidden lg:flex items-center justify-center w-6 h-6 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0',
              sidebarCollapsed && 'lg:hidden',
            )}
            title="Colapsar menú"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Expand button — only visible when collapsed on desktop */}
        {sidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex items-center justify-center py-2.5 border-t border-border text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            title="Expandir menú"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </aside>
    </>
  )
}
