import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Mail, Lock } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function LoginForm() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Correo o contraseña incorrectos.')
      setLoading(false)
      return
    }
    await navigate({ to: '/' })
  }

  return (
    <div className="w-full max-w-[360px]">
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

      {/* Card */}
      <div className="card-solid overflow-hidden">
        <div className="px-1 pt-4 pb-0 border-b border-border">
          <p className="text-center text-[12px] font-semibold tracking-[0.4px] text-accent border-b-2 border-accent pb-3 mx-6">
            Ingresar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email" className="text-[10.5px] font-semibold tracking-[0.8px] uppercase text-muted-foreground">
              Correo electrónico
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                required
                autoComplete="email"
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password" className="text-[10.5px] font-semibold tracking-[0.8px] uppercase text-muted-foreground">
              Contraseña
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="pl-9"
              />
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 px-3 py-2">
              <p className="text-[12px] text-destructive">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full mt-1 text-[11px] tracking-[1.4px] uppercase font-bold h-9"
          >
            {loading ? 'Ingresando…' : 'Ingresar'}
          </Button>
        </form>
      </div>
    </div>
  )
}
