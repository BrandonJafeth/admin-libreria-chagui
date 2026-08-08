import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)

// PostgREST/RLS gotcha: a DELETE blocked by RLS matches 0 rows and returns NO error —
// it looks identical to a successful delete unless the affected rows are checked explicitly.
// Every "delete one specific record" call must .select() the deleted row(s) and pass them here,
// or a silently-blocked delete shows a false "eliminado" success toast.
export function assertDeleted<T>(data: T[] | null, subject: string): void {
  if (!data || data.length === 0) {
    throw new Error(`No se pudo eliminar ${subject}: no tenés permiso o ya no existe.`)
  }
}
