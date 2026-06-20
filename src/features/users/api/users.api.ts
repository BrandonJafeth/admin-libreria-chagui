import { supabase } from '@/lib/supabase/client'

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
  if (!byId.error && byId.data) return byId.data.role as 'admin' | 'employee'
  const byEmail = await supabase.from('profiles').select('role').eq('email', user.email).maybeSingle()
  if (!byEmail.error && byEmail.data) return byEmail.data.role as 'admin' | 'employee'
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
  if (error) throw new Error(error.message)
  if (data && !data.success) throw new Error(data.error ?? 'Error al crear usuario')
}

export async function deleteUser(userId: string): Promise<void> {
  const { error } = await supabase.functions.invoke('delete-user', {
    body: { user_id: userId },
  })
  if (error) throw new Error(error.message)
}
