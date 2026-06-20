import { useQuery } from '@tanstack/react-query'
import { fetchProducts, type ProductFilters } from '../api/products.api'

export const PRODUCTS_KEY = ['products'] as const

export function productsQueryKey(filters?: ProductFilters) {
  return filters ? ([...PRODUCTS_KEY, filters] as const) : PRODUCTS_KEY
}

export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: productsQueryKey(filters),
    queryFn: () => fetchProducts(filters),
    placeholderData: (prev) => prev,
  })
}
