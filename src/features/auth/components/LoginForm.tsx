import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Mail, Lock, ArrowLeft, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import { mapSupabaseError } from '@/lib/errors'

type Mode = 'login' | 'forgot'

export function LoginForm() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('login')

  // Login state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loginLoading, setLoginLoading] = useState(false)

  // Forgot state
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotError, setForgotError] = useState<string | null>(null)
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginError(null)
    setLoginLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setLoginError('Correo o contraseña incorrectos.')
      setLoginLoading(false)
      return
    }
    await navigate({ to: '/' })
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault()
    setForgotError(null)
    setForgotLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setForgotLoading(false)
    if (error) {
      setForgotError(mapSupabaseError(error))
      return
    }
    setForgotSent(true)
  }

  function switchMode(next: Mode) {
    setMode(next)
    setLoginError(null)
    setForgotError(null)
    setForgotSent(false)
  }

  return (
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

      {/* Card */}
      <div className="card-solid overflow-hidden">
        {/* Tabs */}
        <div className="px-1 pt-4 pb-0 border-b border-border flex">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`flex-1 text-center text-[12px] font-semibold tracking-[0.4px] pb-3 border-b-2 transition-colors ${
              mode === 'login'
                ? 'text-accent border-accent'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            Ingresar
          </button>
          <button
            type="button"
            onClick={() => switchMode('forgot')}
            className={`flex-1 text-center text-[12px] font-semibold tracking-[0.4px] pb-3 border-b-2 transition-colors ${
              mode === 'forgot'
                ? 'text-accent border-accent'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            Olvidé contraseña
          </button>
        </div>

        {/* Login form */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="p-6 flex flex-col gap-4">
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
              <PasswordInput
                id="password"
                leftIcon={<Lock className="h-3.5 w-3.5" />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {loginError && (
              <div className="bg-destructive/10 border border-destructive/20 px-3 py-2">
                <p className="text-[12px] text-destructive">{loginError}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loginLoading}
              className="w-full mt-1 text-[11px] tracking-[1.4px] uppercase font-bold h-9"
            >
              {loginLoading ? 'Ingresando…' : 'Ingresar'}
            </Button>
          </form>
        )}

        {/* Forgot password form */}
        {mode === 'forgot' && (
          <div className="p-6">
            {forgotSent ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <CheckCircle className="h-8 w-8 text-accent" />
                <p className="text-[13px] font-semibold text-foreground">Revisá tu correo</p>
                <p className="text-[12px] text-muted-foreground leading-relaxed">
                  Enviamos un enlace a <span className="font-medium text-foreground">{forgotEmail}</span> para restablecer tu contraseña.
                </p>
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Volver al inicio
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgot} className="flex flex-col gap-4">
                <p className="text-[12px] text-muted-foreground leading-relaxed">
                  Ingresá tu correo y te enviaremos un enlace para restablecer tu contraseña.
                </p>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="forgot-email" className="text-[10.5px] font-semibold tracking-[0.8px] uppercase text-muted-foreground">
                    Correo electrónico
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                      id="forgot-email"
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="correo@ejemplo.com"
                      required
                      autoComplete="email"
                      className="pl-9"
                    />
                  </div>
                </div>

                {forgotError && (
                  <div className="bg-destructive/10 border border-destructive/20 px-3 py-2">
                    <p className="text-[12px] text-destructive">{forgotError}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full text-[11px] tracking-[1.4px] uppercase font-bold h-9"
                >
                  {forgotLoading ? 'Enviando…' : 'Enviar enlace'}
                </Button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
