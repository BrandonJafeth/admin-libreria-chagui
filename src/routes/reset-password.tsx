import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { z } from 'zod'
import { Lock, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const Route = createFileRoute('/reset-password')({
  component: ResetPasswordPage,
})

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

function ResetPasswordPage() {
  const navigate = useNavigate()
  // Check hash immediately — Supabase v2 puts type=recovery in the URL hash
  const [ready, setReady] = useState(() =>
    typeof window !== 'undefined' && window.location.hash.includes('type=recovery'),
  )
  const [success, setSuccess] = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)

  useEffect(() => {
    if (ready) return
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [ready])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: standardSchemaResolver(schema),
    defaultValues: { password: '', confirm: '' },
  })

  async function onSubmit(values: FormValues) {
    setGlobalError(null)
    const { error } = await supabase.auth.updateUser({ password: values.password })
    if (error) {
      setGlobalError(error.message)
      return
    }
    supabase.functions.invoke('notify-password-changed', { body: {} }).catch(console.error)
    setSuccess(true)
    setTimeout(() => navigate({ to: '/login' }), 2500)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background cuaderno-bg p-4">
      <div className="w-full max-w-90">
        {/* Brand mark */}
        <div className="text-center mb-8">
          <div className="inline-flex flex-col items-center gap-2 mb-5">
            <div className="font-heading text-[28px] font-bold tracking-[4px] uppercase leading-none text-foreground">
              CHA<span className="text-accent">GUI</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-0.5 w-6 bg-accent" />
              <span className="text-[9px] font-semibold tracking-[1.8px] uppercase text-muted-foreground opacity-75">
                Librería &amp; Bazar
              </span>
              <div className="h-0.5 w-6 bg-accent" />
            </div>
          </div>
          <p className="text-[12px] text-muted-foreground tracking-[0.3px]">Panel administrativo</p>
        </div>

        <div className="card-solid overflow-hidden">
          <div className="px-1 pt-4 pb-0 border-b border-border">
            <p className="text-center text-[12px] font-semibold tracking-[0.4px] text-accent border-b-2 border-accent pb-3 mx-6">
              Nueva contraseña
            </p>
          </div>

          <div className="p-6">
            {success ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <CheckCircle className="h-8 w-8 text-accent" />
                <p className="text-[13px] font-semibold text-foreground">Contraseña actualizada</p>
                <p className="text-[12px] text-muted-foreground">Redirigiendo al inicio…</p>
              </div>
            ) : !ready ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <p className="text-[12px] text-muted-foreground">Verificando enlace…</p>
                <p className="text-[11px] text-muted-foreground/60">
                  Si llegaste aquí por error,{' '}
                  <button
                    type="button"
                    onClick={() => navigate({ to: '/login' })}
                    className="text-accent underline"
                  >
                    volvé al inicio
                  </button>
                  .
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[10.5px] font-semibold tracking-[0.8px] uppercase text-muted-foreground">
                    Nueva contraseña
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      className="pl-9"
                      {...register('password')}
                      aria-invalid={!!errors.password}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive">{errors.password.message}</p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-[10.5px] font-semibold tracking-[0.8px] uppercase text-muted-foreground">
                    Confirmar contraseña
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                      type="password"
                      placeholder="Repetí la contraseña"
                      className="pl-9"
                      {...register('confirm')}
                      aria-invalid={!!errors.confirm}
                    />
                  </div>
                  {errors.confirm && (
                    <p className="text-xs text-destructive">{errors.confirm.message}</p>
                  )}
                </div>

                {globalError && (
                  <div className="bg-destructive/10 border border-destructive/20 px-3 py-2">
                    <p className="text-[12px] text-destructive">{globalError}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-1 text-[11px] tracking-[1.4px] uppercase font-bold h-9"
                >
                  {isSubmitting ? 'Guardando…' : 'Guardar contraseña'}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
