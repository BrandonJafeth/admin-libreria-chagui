import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { BookOpen, Mail, Lock } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Mode = 'login' | 'register'

export function LoginForm() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function switchMode(m: Mode) {
    setMode(m)
    setError(null)
    setSuccess(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
      await navigate({ to: '/' })
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
      setSuccess('Cuenta creada. Revisa tu correo para confirmar el registro.')
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-[360px]">
      {/* Brand mark */}
      <div className="text-center mb-8">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent shadow-lg mb-4">
          <BookOpen className="h-7 w-7 text-white" />
        </div>
        <h1 className="font-heading text-2xl font-bold text-foreground leading-tight">
          Librería Chaguí
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5">Panel administrativo</p>
      </div>

      {/* Card */}
      <div className="card-solid rounded-2xl overflow-hidden">
        {/* Mode tabs */}
        <div className="flex border-b border-border">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              mode === 'login'
                ? 'text-accent border-b-2 border-accent -mb-px'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Ingresar
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              mode === 'register'
                ? 'text-accent border-b-2 border-accent -mb-px'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Registrar
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Correo electrónico</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@ejemplo.com"
                required
                autoComplete="email"
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                minLength={mode === 'register' ? 6 : undefined}
                className="pl-9"
              />
            </div>
            {mode === 'register' && (
              <p className="text-xs text-muted-foreground">Mínimo 6 caracteres</p>
            )}
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          {success && (
            <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full mt-1">
            {loading
              ? mode === 'login'
                ? 'Ingresando…'
                : 'Registrando…'
              : mode === 'login'
                ? 'Ingresar'
                : 'Crear cuenta'}
          </Button>
        </form>
      </div>
    </div>
  )
}
