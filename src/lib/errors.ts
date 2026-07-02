// Maps raw Supabase/Postgrest/Auth errors to clear, actionable Spanish messages.
// Goal: a stale/expired session must never fail silently or cryptically again —
// see incident: RLS error shown after long idle, user didn't realize it meant "log in again".

function extractMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message?: unknown }).message ?? '')
  }
  return ''
}

function extractCode(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    return String((error as { code?: unknown }).code ?? '').toLowerCase()
  }
  return ''
}

// In this app any authenticated user has full write access (no per-role RLS on writes),
// so an RLS violation on insert/update only happens when the JWT is missing/expired —
// treat it as a session error, not a generic permission error.
export function isSessionError(error: unknown): boolean {
  const msg = extractMessage(error).toLowerCase()
  const code = extractCode(error)
  return (
    code === 'pgrst301' ||
    code === '401' ||
    msg.includes('jwt expired') ||
    msg.includes('jwt is expired') ||
    msg.includes('invalid claim') ||
    msg.includes('invalid refresh token') ||
    msg.includes('refresh_token_not_found') ||
    msg.includes('session_not_found') ||
    msg.includes('session from session_id claim in jwt does not exist') ||
    msg.includes('not authenticated') ||
    msg.includes('violates row-level security')
  )
}

export function mapSupabaseError(error: unknown): string {
  if (isSessionError(error)) {
    return 'Tu sesión expiró. Volvé a iniciar sesión e intentá de nuevo.'
  }

  const msg = extractMessage(error)
  const lower = msg.toLowerCase()

  if (lower.includes('duplicate key value') || lower.includes('already exists')) {
    return 'Ya existe un registro con ese valor (revisá nombre o slug).'
  }
  if (lower.includes('violates foreign key constraint')) {
    return 'No se puede completar: hay datos relacionados que lo impiden.'
  }
  if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('network request failed')) {
    return 'Sin conexión a internet. Revisá tu red e intentá de nuevo.'
  }
  if (!msg) {
    return 'Ocurrió un error inesperado. Intentá de nuevo.'
  }
  return msg
}
