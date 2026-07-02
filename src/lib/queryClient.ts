import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query'
import { supabase } from './supabase/client'
import { isSessionError } from './errors'

// Session errors (expired/invalid JWT) can surface from any query or mutation.
// Without this, a stale tab just shows a cryptic RLS/JWT error and the user
// has no idea they need to log in again — force it instead of failing silently.
let signingOut = false
function handlePotentialSessionError(error: unknown) {
  if (signingOut || !isSessionError(error)) return
  signingOut = true
  supabase.auth.signOut().finally(() => {
    window.location.href = '/login'
  })
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 min — admin tool, no aggressive refresh
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
  queryCache: new QueryCache({ onError: handlePotentialSessionError }),
  mutationCache: new MutationCache({ onError: handlePotentialSessionError }),
})
