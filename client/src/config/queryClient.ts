import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Retry once on failure, then fail
      staleTime: 1000 * 60 * 5, // Data is fresh for 5 minutes (aggressive caching)
      refetchOnWindowFocus: false, // Don't refetch just because user clicked alt-tab
      refetchOnReconnect: 'always', // Do refetch if internet comes back
    },
    mutations: {
      retry: 0, // Don't retry POST/PUT requests automatically (risky)
    },
  },
})