import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 min — admin tool, no aggressive refresh
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})
