import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from './input'
import { cn } from '@/lib/utils'
import type { ComponentProps, ReactNode } from 'react'

interface PasswordInputProps extends Omit<ComponentProps<typeof Input>, 'type'> {
  leftIcon?: ReactNode
}

export function PasswordInput({ className, leftIcon, ...props }: PasswordInputProps) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      {leftIcon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
          {leftIcon}
        </span>
      )}
      <Input
        type={show ? 'text' : 'password'}
        className={cn(leftIcon ? 'pl-9' : '', 'pr-10', className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        tabIndex={-1}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
      >
        {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
    </div>
  )
}
