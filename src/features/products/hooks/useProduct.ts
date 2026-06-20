import { useSuspenseQuery } from '@tanstack/react-query'
import { fetchProduct } from '../api/products.api'

export function productQueryKey(id: string) {
  return ['product', id] as const
}

export function useProduct(id: string) {
  return useSuspenseQuery({
    queryKey: productQueryKey(id),
    queryFn: () => fetchProduct(id),
  })
}
