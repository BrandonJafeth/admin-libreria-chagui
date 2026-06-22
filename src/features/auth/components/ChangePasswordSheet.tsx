import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { z } from 'zod'
import { Lock } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { sileo } from 'sileo'

const schema = z
  .object({
    password: z.string().min(6, 'Mínimo 6 caracteres'),
    confirm: z.string().min(1, 'Confirmá la contraseña'),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Las contraseñas no coinciden',
    path: ['confirm'],
  })

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ChangePasswordSheet({ open, onOpenChange }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: standardSchemaResolver(schema),
    defaultValues: { password: '', confirm: '' },
  })

  async function onSubmit(values: FormValues) {
    const { error } = await supabase.auth.updateUser({ password: values.password })
    if (error) {
      sileo.error({ title: 'Error al cambiar contraseña', description: error.message })
      return
    }

    // Fire-and-forget notification email
    supabase.functions
      .invoke('notify-password-changed', { body: {} })
      .catch(console.error)

    sileo.success({ title: 'Contraseña actualizada', description: 'Recibirás un correo de confirmación.' })
    reset()
    onOpenChange(false)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) reset()
        onOpenChange(o)
      }}
    >
      <SheetContent className="sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Cambiar contraseña</SheetTitle>
          <SheetDescription>
            Ingresá tu nueva contraseña. Recibirás un correo de confirmación.
          </SheetDescription>
        </SheetHeader>

        <div className="px-6 py-6">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[10.5px] font-semibold tracking-[0.8px] uppercase text-muted-foreground">
                Nueva contraseña
              </Label>
              <PasswordInput
                leftIcon={<Lock className="h-3.5 w-3.5" />}
                placeholder="Mínimo 6 caracteres"
                {...register('password')}
                aria-invalid={!!errors.password}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-[10.5px] font-semibold tracking-[0.8px] uppercase text-muted-foreground">
                Confirmar contraseña
              </Label>
              <PasswordInput
                leftIcon={<Lock className="h-3.5 w-3.5" />}
                placeholder="Repetí la contraseña"
                {...register('confirm')}
                aria-invalid={!!errors.confirm}
              />
              {errors.confirm && (
                <p className="text-xs text-destructive">{errors.confirm.message}</p>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => { reset(); onOpenChange(false) }}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando…' : 'Guardar'}
              </Button>
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  )
}
