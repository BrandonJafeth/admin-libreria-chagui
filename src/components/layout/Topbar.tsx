import { useState } from 'react'
import { Link, useMatches } from '@tanstack/react-router'
import { ChevronRight, KeyRound, LogOut, Menu } from 'lucide-react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useUIStore } from '@/store/ui-store'
import { cn } from '@/lib/utils'
import { ChangePasswordSheet } from '@/features/auth/components/ChangePasswordSheet'

declare module '@tanstack/react-router' {
  interface StaticDataRouteOption {
    breadcrumb?: string
  }
}

export function Topbar() {
  const { user, signOut } = useAuth()
  const { sidebarCollapsed, sidebarMobileOpen, setSidebarMobileOpen } = useUIStore()
  const matches = useMatches()
  const [changingPassword, setChangingPassword] = useState(false)

  const crumbs = matches
    .filter((m) => m.staticData.breadcrumb)
    .map((m) => ({ label: m.staticData.breadcrumb!, path: m.pathname }))

  const initial = user?.email ? user.email.split('@')[0][0].toUpperCase() : 'A'

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 flex h-14 items-center justify-between',
        'border-b border-border bg-card px-6 transition-all duration-200',
        'left-0',
        sidebarCollapsed ? 'lg:left-14' : 'lg:left-60',
      )}
    >
      <div className="flex items-center gap-1.5">
        {/* Hamburger — mobile only */}
        <button
          onClick={() => setSidebarMobileOpen(!sidebarMobileOpen)}
          className="lg:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors mr-1"
          aria-label="Abrir menú"
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-[12px]">
          {crumbs.length === 0 && (
            <span className="font-semibold text-foreground tracking-wide">Dashboard</span>
          )}
          {crumbs.map((crumb, i) => (
            <span key={crumb.path} className="flex items-center gap-1.5">
              {i > 0 && (
                <ChevronRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />
              )}
              {i < crumbs.length - 1 ? (
                <Link
                  to={crumb.path}
                  className="text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-semibold text-foreground tracking-[0.2px]">
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      </div>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-[13px] font-semibold text-white hover:bg-accent/80 transition-colors select-none"
            title={user?.email ?? 'Usuario'}
          >
            {initial}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {user?.email && (
            <>
              <div className="px-3 py-2 text-[11px] text-muted-foreground truncate font-medium">
                {user.email}
              </div>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem
            onClick={() => setChangingPassword(true)}
            className="gap-2 text-[12px]"
          >
            <KeyRound className="h-3.5 w-3.5" />
            Cambiar contraseña
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => signOut()}
            className="text-destructive focus:text-destructive gap-2 text-[12px]"
          >
            <LogOut className="h-3.5 w-3.5" />
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ChangePasswordSheet open={changingPassword} onOpenChange={setChangingPassword} />
    </header>
  )
}
