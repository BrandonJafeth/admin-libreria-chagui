import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createGift, updateGift, deleteGift, type GiftInsert, type GiftUpdate } from '../api/gifts.api'
import { GIFTS_KEY } from './useGifts'

export function useCreateGift() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: GiftInsert) => createGift(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: GIFTS_KEY }),
  })
}

export function useUpdateGift() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: GiftUpdate }) => updateGift(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: GIFTS_KEY }),
  })
}

export function useDeleteGift() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteGift(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: GIFTS_KEY }),
  })
}
