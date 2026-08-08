import { supabase, assertDeleted } from '@/lib/supabase/client'
import { uploadToCloudinary, extractPublicId } from '@/lib/cloudinary'
import type { Tables, Insertable, Updatable } from '@/types/database.types'

export type Product = Tables<'products'>
export type ProductImage = Tables<'product_images'>
export type ProductColor = Tables<'product_colors'>
export type BundleItem = Tables<'product_bundle_items'>
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
  product_bundle_items: (BundleItem & { producto: { id: string; nombre: string; precio: number } })[]
}

export interface ProductFilters {
  q?: string
  estado?: 'disponible' | 'agotado'
  destacado?: boolean
  tipo?: 'simple' | 'paquete'
  conDescuento?: boolean
  categoryId?: string
  page?: number
  pageSize?: number
}

export const DEFAULT_PAGE_SIZE = 20

export interface ProductsPage {
  data: ProductListItem[]
  count: number
}

export async function fetchProducts(filters?: ProductFilters): Promise<ProductsPage> {
  const page = filters?.page ?? 1
  const pageSize = filters?.pageSize ?? DEFAULT_PAGE_SIZE
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // Use !inner join when filtering by category so only matching products are returned
  const discountCols =
    'descuento_tipo, precio_oferta, descuento_porcentaje, descuento_activo, descuento_inicio, descuento_fin'
  const selectStr = filters?.categoryId
    ? `id, slug, nombre, precio, estado, destacado, created_at, tipo, ${discountCols}, product_images(url, es_principal), product_categories!inner(category_id)`
    : `id, slug, nombre, precio, estado, destacado, created_at, tipo, ${discountCols}, product_images(url, es_principal), product_categories(category_id)`

  let query = supabase
    .from('products')
    .select(selectStr, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (filters?.q) query = query.ilike('nombre', `%${filters.q}%`)
  if (filters?.estado) query = query.eq('estado', filters.estado)
  if (filters?.destacado !== undefined) query = query.eq('destacado', filters.destacado)
  if (filters?.tipo) query = query.eq('tipo', filters.tipo)
  if (filters?.conDescuento !== undefined) {
    query = filters.conDescuento
      ? query.not('descuento_tipo', 'is', null)
      : query.is('descuento_tipo', null)
  }
  if (filters?.categoryId) query = query.eq('product_categories.category_id', filters.categoryId)

  const { data, error, count } = await query
  if (error) throw error
  return { data: data as ProductListItem[], count: count ?? 0 }
}

export interface ProductSearchResult {
  id: string
  nombre: string
  precio: number
}

export async function searchProducts(
  q: string,
  opts?: { excludeTipo?: 'paquete'; excludeIds?: string[] },
): Promise<ProductSearchResult[]> {
  if (!q.trim()) return []
  let query = supabase
    .from('products')
    .select('id, nombre, precio')
    .ilike('nombre', `%${q.trim()}%`)
  if (opts?.excludeTipo) query = query.neq('tipo', opts.excludeTipo)
  // Excluir en el query, no después del límite — si no, un producto válido más allá
  // del top-20 nunca aparece cuando los ya-agregados ocupan las primeras posiciones.
  if (opts?.excludeIds && opts.excludeIds.length > 0) {
    query = query.not('id', 'in', `(${opts.excludeIds.join(',')})`)
  }
  const { data, error } = await query.order('nombre', { ascending: true }).limit(20)
  if (error) throw error
  return data
}

export async function fetchProductsByIds(ids: string[]): Promise<ProductSearchResult[]> {
  if (ids.length === 0) return []
  const { data, error } = await supabase.from('products').select('id, nombre, precio').in('id', ids)
  if (error) throw error
  return data
}

export async function fetchProduct(id: string): Promise<ProductDetail> {
  const { data, error } = await supabase
    .from('products')
    .select(
      '*, product_images(*), product_colors(*), product_categories(category_id), product_bundle_items!paquete_id(*, producto:products!producto_id(id, nombre, precio))',
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
  const { error: delErr } = await supabase.from('product_categories').delete().eq('product_id', id)
  if (delErr) throw delErr
  if (categoryIds.length > 0) {
    const { error: catErr } = await supabase
      .from('product_categories')
      .insert(categoryIds.map((category_id) => ({ product_id: id, category_id })))
    if (catErr) throw catErr
  }
}

export async function deleteProduct(id: string): Promise<void> {
  // Cloudinary cleanup is irreversible and external — it must only run AFTER the product
  // row is confirmed deleted. Otherwise a blocked delete (e.g. producto usado como
  // componente de un paquete → FK RESTRICT, o sin permiso) leaves the product intact
  // but with its photos already gone forever.
  const { data: images } = await supabase
    .from('product_images')
    .select('url')
    .eq('product_id', id)

  const { error: reviewErr } = await supabase.from('product_reviews').delete().eq('product_id', id)
  if (reviewErr) throw reviewErr

  const { data, error } = await supabase.from('products').delete().eq('id', id).select('id')
  if (error) throw error
  assertDeleted(data, 'el producto')

  if (images && images.length > 0) {
    const publicIds = images.map((img) => extractPublicId(img.url)).filter(Boolean)
    if (publicIds.length > 0) {
      const { error: cloudErr } = await supabase.functions.invoke('cloudinary-delete', { body: { public_ids: publicIds } })
      if (cloudErr) console.error('[deleteProduct] Cloudinary cleanup failed:', cloudErr.message)
    }
  }
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

// Images — stored in Cloudinary; delete via cloudinary-delete Edge Function
export async function uploadProductImage(
  productId: string,
  file: File,
  orden: number,
  esPrincipal: boolean,
  alt?: string,
): Promise<void> {
  const { url } = await uploadToCloudinary(file)

  const { error: dbErr } = await supabase.from('product_images').insert({
    product_id: productId,
    url,
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
  const publicId = extractPublicId(url)
  if (publicId) {
    const { error: cloudErr } = await supabase.functions.invoke('cloudinary-delete', {
      body: { public_ids: [publicId] },
    })
    if (cloudErr) throw new Error(cloudErr.message)
  }
  const { data, error } = await supabase.from('product_images').delete().eq('id', imageId).select('id')
  if (error) throw error
  assertDeleted(data, 'la imagen')
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

export async function reorderProductImages(
  updates: { id: string; orden: number }[],
): Promise<void> {
  const results = await Promise.all(
    updates.map(({ id, orden }) =>
      supabase.from('product_images').update({ orden }).eq('id', id),
    ),
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) throw failed.error
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
  const { data, error } = await supabase.from('product_colors').delete().eq('id', colorId).select('id')
  if (error) throw error
  assertDeleted(data, 'el color')
}

// Bundle items (paquetes)
export async function addBundleItem(
  paqueteId: string,
  productoId: string,
  cantidad: number,
  orden: number,
): Promise<void> {
  const { error } = await supabase.from('product_bundle_items').insert({
    paquete_id: paqueteId,
    producto_id: productoId,
    cantidad,
    orden,
  })
  if (error) throw error
}

export async function deleteBundleItem(id: string): Promise<void> {
  const { data, error } = await supabase.from('product_bundle_items').delete().eq('id', id).select('id')
  if (error) throw error
  assertDeleted(data, 'el componente')
}
