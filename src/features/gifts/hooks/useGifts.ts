import { useQuery } from '@tanstack/react-query'
import { fetchGifts } from '../api/gifts.api'

export const GIFTS_KEY = ['gifts'] as const

export function useGifts() {
  return useQuery({
    queryKey: GIFTS_KEY,
    queryFn: fetchGifts,
  })
}
