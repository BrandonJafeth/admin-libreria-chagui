import { supabase, assertDeleted } from '@/lib/supabase/client'
import type { Tables, Insertable, Updatable } from '@/types/database.types'

export type Gift = Tables<'product_gifts'>
export type GiftInsert = Insertable<'product_gifts'>
export type GiftUpdate = Updatable<'product_gifts'>

export type GiftListItem = Gift & {
  producto_disparador: { id: string; nombre: string } | null
  producto_regalo: { id: string; nombre: string } | null
}

export async function fetchGifts(): Promise<GiftListItem[]> {
  const { data, error } = await supabase
    .from('product_gifts')
    .select(
      '*, producto_disparador:products!producto_disparador_id(id, nombre), producto_regalo:products!producto_regalo_id(id, nombre)',
    )
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as GiftListItem[]
}

export async function createGift(payload: GiftInsert): Promise<Gift> {
  const { data, error } = await supabase.from('product_gifts').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateGift(id: string, updates: GiftUpdate): Promise<Gift> {
  const { data, error } = await supabase.from('product_gifts').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteGift(id: string): Promise<void> {
  const { data, error } = await supabase.from('product_gifts').delete().eq('id', id).select('id')
  if (error) throw error
  assertDeleted(data, 'la regalía')
}
