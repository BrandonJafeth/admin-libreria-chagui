import { supabase } from '@/lib/supabase/client'
import type { Tables, Insertable, Updatable } from '@/types/database.types'

export type Product = Tables<'products'>
export type ProductImage = Tables<'product_images'>
export type ProductColor = Tables<'product_colors'>
export type ProductInsert = Insertable<'products'>
export type ProductUpdate = Updatable<'products'>

// Shape returned by list query — embed approach: simpler than a view,
// avoids DB-side filtering of es_principal; acceptable for admin workloads
export type ProductListItem = Product & {
  product_images: Pick<ProductImage, 'url' | 'es_principal'>[]
  product_categories: { category_id: string }[]
}

export type ProductDetail = Product & {
  product_images: ProductImage[]
  product_colors: ProductColor[]
  product_categories: { category_id: string }[]
}

export interface ProductFilters {
  q?: string
  estado?: 'disponible' | 'agotado'
  destacado?: boolean
}

export async function fetchProducts(
  filters?: ProductFilters,
): Promise<ProductListItem[]> {
  let query = supabase
    .from('products')
    .select(
      'id, slug, nombre, precio, estado, destacado, created_at, product_images(url, es_principal), product_categories(category_id)',
    )
    .order('created_at', { ascending: false })

  if (filters?.q) {
    query = query.ilike('nombre', `%${filters.q}%`)
  }
  if (filters?.estado) {
    query = query.eq('estado', filters.estado)
  }
  if (filters?.destacado !== undefined) {
    query = query.eq('destacado', filters.destacado)
  }

  const { data, error } = await query
  if (error) throw error
  return data as ProductListItem[]
}

export async function fetchProduct(id: string): Promise<ProductDetail> {
  const { data, error } = await supabase
    .from('products')
    .select(
      '*, product_images(*), product_colors(*), product_categories(category_id)',
    )
    .eq('id', id)
    .single()
  if (error) throw error

  const detail = data as ProductDetail
  detail.product_images.sort((a, b) => a.orden - b.orden)
  detail.product_colors.sort((a, b) => a.orden - b.orden)

  return detail
}

export async function createProduct(
  product: ProductInsert,
  categoryIds: string[],
): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select()
    .single()
  if (error) throw error

  if (categoryIds.length > 0) {
    const { error: catErr } = await supabase
      .from('product_categories')
      .insert(categoryIds.map((category_id) => ({ product_id: data.id, category_id })))
    if (catErr) throw catErr
  }

  return data
}

export async function updateProduct(
  id: string,
  updates: ProductUpdate,
  categoryIds: string[],
): Promise<void> {
  const { error } = await supabase.from('products').update(updates).eq('id', id)
  if (error) throw error

  // Replace categories: delete all → insert new
  await supabase.from('product_categories').delete().eq('product_id', id)
  if (categoryIds.length > 0) {
    const { error: catErr } = await supabase
      .from('product_categories')
      .insert(categoryIds.map((category_id) => ({ product_id: id, category_id })))
    if (catErr) throw catErr
  }
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}

export async function toggleProductEstado(
  id: string,
  estado: 'disponible' | 'agotado',
): Promise<void> {
  const { error } = await supabase.from('products').update({ estado }).eq('id', id)
  if (error) throw error
}

export async function toggleProductDestacado(
  id: string,
  destacado: boolean,
): Promise<void> {
  const { error } = await supabase.from('products').update({ destacado }).eq('id', id)
  if (error) throw error
}

// Images — assumes bucket 'product-images' exists (public)
// To create: supabase storage create product-images --public
export async function uploadProductImage(
  productId: string,
  file: File,
  orden: number,
  esPrincipal: boolean,
  alt?: string,
): Promise<void> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${productId}/${Date.now()}.${ext}`

  const { error: uploadErr } = await supabase.storage
    .from('product-images')
    .upload(path, file)
  if (uploadErr) throw uploadErr

  const {
    data: { publicUrl },
  } = supabase.storage.from('product-images').getPublicUrl(path)

  const { error: dbErr } = await supabase.from('product_images').insert({
    product_id: productId,
    url: publicUrl,
    orden,
    es_principal: esPrincipal,
    alt: alt ?? null,
  })
  if (dbErr) throw dbErr
}

export async function deleteProductImage(
  imageId: string,
  url: string,
): Promise<void> {
  const pathMatch = url.split('/product-images/')[1]
  if (pathMatch) {
    await supabase.storage.from('product-images').remove([pathMatch])
  }
  const { error } = await supabase.from('product_images').delete().eq('id', imageId)
  if (error) throw error
}

export async function setMainImage(
  imageId: string,
): Promise<void> {
  // Trigger enforce_single_main_image handles unsetting other images
  const { error } = await supabase
    .from('product_images')
    .update({ es_principal: true })
    .eq('id', imageId)
  if (error) throw error
}

// Colors
export async function upsertProductColor(
  productId: string,
  color: { id?: string; nombre: string; hex?: string | null; orden: number },
): Promise<void> {
  if (color.id) {
    const { error } = await supabase
      .from('product_colors')
      .update({ nombre: color.nombre, hex: color.hex ?? null, orden: color.orden })
      .eq('id', color.id)
    if (error) throw error
  } else {
    const { error } = await supabase.from('product_colors').insert({
      product_id: productId,
      nombre: color.nombre,
      hex: color.hex ?? null,
      orden: color.orden,
    })
    if (error) throw error
  }
}

export async function deleteProductColor(colorId: string): Promise<void> {
  const { error } = await supabase.from('product_colors').delete().eq('id', colorId)
  if (error) throw error
}
