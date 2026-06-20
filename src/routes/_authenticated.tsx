import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase/client'
import { fetchMyRole } from '@/features/users/api/users.api'
import { MY_ROLE_KEY } from '@/features/users/hooks/useUsers'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location, context }) => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }
    // ensureQueryData: hit network only when cache is stale (5 min)
    const userRole = await context.queryClient.ensureQueryData({
      queryKey: [...MY_ROLE_KEY, session.user.id],
      queryFn: fetchMyRole,
      staleTime: 5 * 60 * 1000,
    })
    return { userRole }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  )
}
