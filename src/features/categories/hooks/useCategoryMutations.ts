import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  type Category,
  type CategoryInsert,
  type CategoryUpdate,
} from '../api/categories.api'
import { CATEGORIES_KEY } from './useCategories'

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CategoryInsert) => createCategory(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: CATEGORIES_KEY }),
  })
}

export function useUpdateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: CategoryUpdate }) =>
      updateCategory(id, updates),
    onMutate: async ({ id, updates }) => {
      await qc.cancelQueries({ queryKey: CATEGORIES_KEY })
      qc.setQueryData<Category[]>(CATEGORIES_KEY, (old) =>
        old?.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      )
    },
    onSettled: () => qc.invalidateQueries({ queryKey: CATEGORIES_KEY }),
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: CATEGORIES_KEY })
      qc.setQueryData<Category[]>(CATEGORIES_KEY, (old) => old?.filter((c) => c.id !== id))
    },
    onSettled: () => qc.invalidateQueries({ queryKey: CATEGORIES_KEY }),
  })
}

export function useReorderCategories() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (items: { id: string; orden: number }[]) =>
      reorderCategories(items),
    onSuccess: () => qc.invalidateQueries({ queryKey: CATEGORIES_KEY }),
  })
}
