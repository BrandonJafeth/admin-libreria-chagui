import { Link, useMatches } from '@tanstack/react-router'
import { ChevronRight, LogOut, Menu, User } from 'lucide-react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/store/ui-store'
import { cn } from '@/lib/utils'

declare module '@tanstack/react-router' {
  interface StaticDataRouteOption {
    breadcrumb?: string
  }
}

export function Topbar() {
  const { user, signOut } = useAuth()
  const { sidebarCollapsed, sidebarMobileOpen, setSidebarMobileOpen } = useUIStore()
  const matches = useMatches()

  const crumbs = matches
    .filter((m) => m.staticData.breadcrumb)
    .map((m) => ({ label: m.staticData.breadcrumb!, path: m.pathname }))

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-4 transition-all duration-200',
        // Mobile: full width (sidebar is an overlay, not push)
        'left-0',
        // Desktop: offset by sidebar width
        sidebarCollapsed ? 'lg:left-16' : 'lg:left-56',
      )}
    >
      <div className="flex items-center gap-1">
        {/* Hamburger — mobile only */}
        <button
          onClick={() => setSidebarMobileOpen(!sidebarMobileOpen)}
          className="lg:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1 text-sm">
          {crumbs.length === 0 && (
            <span className="font-medium text-foreground">Dashboard</span>
          )}
          {crumbs.map((crumb, i) => (
            <span key={crumb.path} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
              {i < crumbs.length - 1 ? (
                <Link
                  to={crumb.path}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-medium text-foreground">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      </div>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <User className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {user?.email && (
            <>
              <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">
                {user.email}
              </div>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem
            onClick={() => signOut()}
            className="text-destructive focus:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
