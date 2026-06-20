import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchUsers, fetchMyRole, createUser, deleteUser } from '../api/users.api'
import { useAuthStore } from '@/features/auth/store/auth-store'

export const USERS_KEY = ['users'] as const
export const MY_ROLE_KEY = ['my-role'] as const

export function useUsers() {
  return useQuery({
    queryKey: USERS_KEY,
    queryFn: fetchUsers,
  })
}

export function useMyRole() {
  const userId = useAuthStore((s) => s.user?.id)
  return useQuery({
    queryKey: [...MY_ROLE_KEY, userId],
    queryFn: fetchMyRole,
    staleTime: 5 * 60 * 1000,
    enabled: !!userId,
  })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      email,
      password,
      role,
    }: {
      email: string
      password: string
      role: 'admin' | 'employee'
    }) => createUser(email, password, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: USERS_KEY }),
  })
}

export function useDeleteUser() {
  const qc = useQueryClient()
  const { data: myRole } = useMyRole()
  return useMutation({
    mutationFn: (userId: string) => {
      if (myRole !== 'admin') throw new Error('Sin permiso para eliminar usuarios')
      return deleteUser(userId)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: USERS_KEY }),
  })
}
