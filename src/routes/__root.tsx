import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { Toaster } from 'sileo'
import { useAuth } from '@/features/auth/hooks/useAuth'

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: Root,
})

function Root() {
  const { isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  return (
    <>
      <Outlet />
      <Toaster
          position="top-right"
          options={{
            fill: '#ffffff',
            roundness: 12,
            styles: {
              title: 'text-foreground!',
              description: 'text-muted-foreground!',
              badge: 'bg-foreground/5!',
              button: 'bg-foreground/5! hover:bg-foreground/10!',
            },
          }}
        />
    </>
  )
}
