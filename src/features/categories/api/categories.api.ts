import { supabase } from '@/lib/supabase/client'
import type { Tables, Insertable, Updatable } from '@/types/database.types'

export type Category = Tables<'categories'>
export type CategoryInsert = Insertable<'categories'>
export type CategoryUpdate = Updatable<'categories'>

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('orden', { ascending: true })
  if (error) throw error
  return data
}

export async function createCategory(payload: CategoryInsert): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateCategory(
  id: string,
  updates: CategoryUpdate,
): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function fetchCategoryProductCount(categoryId: string): Promise<number> {
  const { count, error } = await supabase
    .from('product_categories')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', categoryId)
  if (error) throw error
  return count ?? 0
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}

export async function reorderCategories(
  items: { id: string; orden: number }[],
): Promise<void> {
  const results = await Promise.all(
    items.map(({ id, orden }) =>
      supabase.from('categories').update({ orden }).eq('id', id),
    ),
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) throw failed.error
}
