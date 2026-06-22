import { supabase } from '@/lib/supabase/client'
import type { Tables } from '@/types/database.types'

export type Review = Tables<'product_reviews'>

export type ReviewWithProduct = Review & {
  products: { nombre: string; slug: string } | null
}

export type ReviewFilter = 'pending' | 'all'

export async function fetchReviews(filter: ReviewFilter = 'pending'): Promise<ReviewWithProduct[]> {
  let query = supabase
    .from('product_reviews')
    .select('*, products(nombre, slug)')
    .order('created_at', { ascending: false })

  if (filter === 'pending') {
    query = query.eq('approved', false)
  }

  const { data, error } = await query
  if (error) throw error
  return data as ReviewWithProduct[]
}

export async function approveReview(id: string): Promise<Review> {
  const { data, error } = await supabase
    .from('product_reviews')
    .update({ approved: true })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteReview(id: string): Promise<void> {
  const { error } = await supabase.from('product_reviews').delete().eq('id', id)
  if (error) throw error
}
