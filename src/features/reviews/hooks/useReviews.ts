import { useQuery } from '@tanstack/react-query'
import { fetchReviews, type ReviewFilter } from '../api/reviews.api'

export const REVIEWS_KEY = ['reviews'] as const

export function reviewsQueryKey(filter: ReviewFilter) {
  return [...REVIEWS_KEY, filter] as const
}

export function useReviews(filter: ReviewFilter = 'pending') {
  return useQuery({
    queryKey: reviewsQueryKey(filter),
    queryFn: () => fetchReviews(filter),
  })
}
