import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { z } from 'zod'
import { Plus, Users, Shield, UserRound, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import { useAuthStore } from '@/features/auth/store/auth-store'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Controller } from 'react-hook-form'
import { useRouteContext } from '@tanstack/react-router'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useUsers, useCreateUser, useDeleteUser } from '../hooks/useUsers'
import { sileo } from 'sileo'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  role: z.enum(['admin', 'employee']),
})

type FormValues = z.infer<typeof schema>

export function UsersTable() {
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { data: users, isLoading } = useUsers()
  const { userRole } = useRouteContext({ from: '/_authenticated' })
  const isAdmin = userRole === 'admin'
  const currentUserId = useAuthStore((s) => s.user?.id)
  const createMutation = useCreateUser()
  const deleteMutation = useDeleteUser()

  function handleDeleteConfirm() {
    if (!deletingId) return
    deleteMutation.mutate(deletingId, {
      onSuccess: () => {
        setDeletingId(null)
        sileo.success({ title: 'Usuario eliminado' })
      },
      onError: (err) => sileo.error({ title: 'Error al eliminar', description: err.message }),
    })
  }

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: standardSchemaResolver(schema),
    defaultValues: { email: '', password: '', role: 'employee' },
  })

  async function onSubmit(values: FormValues) {
    try {
      await createMutation.mutateAsync(values)
      reset()
      setCreating(false)
      sileo.success({ title: 'Usuario creado' })
    } catch (err) {
      sileo.error({ title: 'Error al crear usuario', description: err instanceof Error ? err.message : 'Intenta de nuevo' })
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div />
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" />
          Nuevo usuario
        </Button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && (!users || users.length === 0) && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm font-medium">Sin usuarios</p>
        </div>
      )}

      {/* List */}
      {!isLoading && users && users.length > 0 && (
        <div className="card-solid rounded-xl overflow-hidden">
          {users.map((user, i) => (
            <div
              key={user.id}
              className={`flex items-center gap-3 px-5 py-3.5 ${
                i > 0 ? 'border-t border-border/60' : ''
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                {user.role === 'admin'
                  ? <Shield className="h-4 w-4 text-accent" />
                  : <UserRound className="h-4 w-4 text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.email}</p>
              </div>
              <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="text-[10px] shrink-0">
                {user.role === 'admin' ? 'Admin' : 'Empleado'}
              </Badge>
              {isAdmin && user.id !== currentUserId && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => setDeletingId(user.id)}
                  aria-label="Eliminar usuario"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="¿Eliminar usuario?"
        description="Esta acción no se puede deshacer. El usuario perderá acceso al sistema inmediatamente."
        confirmLabel="Eliminar"
        onConfirm={handleDeleteConfirm}
        isLoading={deleteMutation.isPending}
      />

      {/* Create sheet */}
      <Sheet open={creating} onOpenChange={(open) => { if (!open) { reset(); createMutation.reset() } setCreating(open) }}>
        <SheetContent className="sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>Nuevo usuario</SheetTitle>
            <SheetDescription>El usuario podrá ingresar al sistema inmediatamente.</SheetDescription>
          </SheetHeader>

          <div className="px-6 py-6">
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Correo electrónico</Label>
                <Input
                  type="email"
                  placeholder="empleado@chagui.com"
                  {...register('email')}
                  aria-invalid={!!errors.email}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Contraseña</Label>
                <PasswordInput
                  placeholder="Mínimo 6 caracteres"
                  {...register('password')}
                  aria-invalid={!!errors.password}
                />
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Rol</Label>
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">Empleado — puede ver y editar</SelectItem>
                        <SelectItem value="admin">Admin — acceso total</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {createMutation.isError && (
                <p className="text-sm text-destructive">{createMutation.error.message}</p>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setCreating(false)}
                  disabled={createMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creando…' : 'Crear usuario'}
                </Button>
              </div>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
