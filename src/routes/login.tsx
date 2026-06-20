import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'
import { supabase } from '@/lib/supabase/client'
import { LoginForm } from '@/features/auth/components/LoginForm'

const searchSchema = z.object({
  redirect: z.string().optional(),
})

export const Route = createFileRoute('/login')({
  validateSearch: searchSchema,
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session) throw redirect({ to: '/' })
  },
  component: LoginPage,
})

function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background cuaderno-bg p-4">
      <LoginForm />
    </div>
  )
}
