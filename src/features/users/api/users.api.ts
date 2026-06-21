import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'

async function extractFunctionError(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json() as { error?: string }
      if (body?.error) return body.error
    } catch {
      // json parse failed, fall through
    }
  }
  return (error as Error).message
}

export interface UserProfile {
  id: string
  email: string
  role: 'admin' | 'employee'
}

export async function fetchUsers(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, role')
    .order('email')
  if (error) throw error
  return data as UserProfile[]
}

export async function fetchMyRole(): Promise<'admin' | 'employee'> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 'employee'
  // Try by id first; fall back to email if profiles.id doesn't match auth uid
  const byId = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (!byId.error && byId.data) return byId.data.role
  if (!user.email) return 'employee'
  const byEmail = await supabase.from('profiles').select('role').eq('email', user.email).maybeSingle()
  if (!byEmail.error && byEmail.data) return byEmail.data.role
  return 'employee'
}

export async function createUser(
  email: string,
  password: string,
  role: 'admin' | 'employee',
): Promise<void> {
  const { data, error } = await supabase.functions.invoke('create-user', {
    body: { email, password, role },
  })
  if (error) throw new Error(await extractFunctionError(error))
  if (data && !data.success) throw new Error(data.error ?? 'Error al crear usuario')
}

export async function deleteUser(userId: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke('delete-user', {
    body: { user_id: userId },
  })
  if (error) throw new Error(await extractFunctionError(error))
  if (data && !data.success) throw new Error(data.error ?? 'Error al eliminar usuario')
}
