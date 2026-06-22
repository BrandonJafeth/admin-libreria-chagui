import { useMutation, useQueryClient } from '@tanstack/react-query'
import { approveReview, deleteReview } from '../api/reviews.api'
import { REVIEWS_KEY } from './useReviews'

export function useApproveReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => approveReview(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: REVIEWS_KEY }),
  })
}

export function useDeleteReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteReview(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: REVIEWS_KEY }),
  })
}
