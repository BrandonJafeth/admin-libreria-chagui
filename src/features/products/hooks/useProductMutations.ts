import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductEstado,
  toggleProductDestacado,
  uploadProductImage,
  deleteProductImage,
  setMainImage,
  reorderProductImages,
  upsertProductColor,
  deleteProductColor,
  type ProductInsert,
  type ProductUpdate,
  type ProductListItem,
} from '../api/products.api'
import { PRODUCTS_KEY } from './useProducts'
import { productQueryKey } from './useProduct'

function useInvalidateProduct(productId?: string) {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: PRODUCTS_KEY })
    if (productId) qc.invalidateQueries({ queryKey: productQueryKey(productId) })
  }
}

export function useCreateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      product,
      categoryIds,
    }: {
      product: ProductInsert
      categoryIds: string[]
    }) => createProduct(product, categoryIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCTS_KEY }),
  })
}

export function useUpdateProduct(productId: string) {
  const invalidate = useInvalidateProduct(productId)
  return useMutation({
    mutationFn: ({
      updates,
      categoryIds,
    }: {
      updates: ProductUpdate
      categoryIds: string[]
    }) => updateProduct(productId, updates, categoryIds),
    onSuccess: invalidate,
  })
}

export function useDeleteProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSettled: () => qc.invalidateQueries({ queryKey: PRODUCTS_KEY }),
  })
}

export function useToggleEstado(productId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (estado: 'disponible' | 'agotado') =>
      toggleProductEstado(productId, estado),
    onMutate: async (newEstado) => {
      await qc.cancelQueries({ queryKey: PRODUCTS_KEY })
      qc.setQueriesData<ProductListItem[]>(
        { queryKey: PRODUCTS_KEY },
        (old) => old?.map((p) => (p.id === productId ? { ...p, estado: newEstado } : p)),
      )
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: PRODUCTS_KEY })
      qc.invalidateQueries({ queryKey: productQueryKey(productId) })
    },
  })
}

export function useToggleDestacado(productId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (destacado: boolean) => toggleProductDestacado(productId, destacado),
    onMutate: async (newDestacado) => {
      await qc.cancelQueries({ queryKey: PRODUCTS_KEY })
      qc.setQueriesData<ProductListItem[]>(
        { queryKey: PRODUCTS_KEY },
        (old) => old?.map((p) => (p.id === productId ? { ...p, destacado: newDestacado } : p)),
      )
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: PRODUCTS_KEY })
      qc.invalidateQueries({ queryKey: productQueryKey(productId) })
    },
  })
}

export function useUploadProductImage(productId: string) {
  const invalidate = useInvalidateProduct(productId)
  return useMutation({
    mutationFn: ({
      file,
      orden,
      esPrincipal,
      alt,
    }: {
      file: File
      orden: number
      esPrincipal: boolean
      alt?: string
    }) => uploadProductImage(productId, file, orden, esPrincipal, alt),
    onSuccess: invalidate,
  })
}

export function useDeleteProductImage(productId: string) {
  const invalidate = useInvalidateProduct(productId)
  return useMutation({
    mutationFn: ({ imageId, url }: { imageId: string; url: string }) =>
      deleteProductImage(imageId, url),
    onSuccess: invalidate,
  })
}

export function useSetMainImage(productId: string) {
  const invalidate = useInvalidateProduct(productId)
  return useMutation({
    mutationFn: (imageId: string) => setMainImage(imageId),
    onSuccess: invalidate,
  })
}

export function useReorderImages(productId: string) {
  const invalidate = useInvalidateProduct(productId)
  return useMutation({
    mutationFn: (updates: { id: string; orden: number }[]) => reorderProductImages(updates),
    onSuccess: invalidate,
  })
}

export function useUpsertProductColor(productId: string) {
  const invalidate = useInvalidateProduct(productId)
  return useMutation({
    mutationFn: (color: {
      id?: string
      nombre: string
      hex?: string | null
      orden: number
    }) => upsertProductColor(productId, color),
    onSuccess: invalidate,
  })
}

export function useDeleteProductColor(productId: string) {
  const invalidate = useInvalidateProduct(productId)
  return useMutation({
    mutationFn: (colorId: string) => deleteProductColor(colorId),
    onSuccess: invalidate,
  })
}
