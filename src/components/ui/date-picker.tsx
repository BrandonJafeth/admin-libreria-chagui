import { useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Popover, PopoverTrigger, PopoverContent } from './popover'

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const MONTH_LABEL = new Intl.DateTimeFormat('es-CR', { month: 'long', year: 'numeric' })
const DAY_LABEL = new Intl.DateTimeFormat('es-CR', { day: 'numeric', month: 'short', year: 'numeric' })

function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseISODate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

// Grilla de 6 filas x 7 columnas, semana empieza lunes — null en los huecos antes/después del mes.
function getMonthGrid(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1)
  const startWeekday = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const grid: (Date | null)[] = []
  for (let i = 0; i < startWeekday; i++) grid.push(null)
  for (let d = 1; d <= daysInMonth; d++) grid.push(new Date(year, month, d))
  while (grid.length < 42) grid.push(null)
  return grid
}

interface DatePickerProps {
  value: string | null | undefined
  onChange: (value: string | null) => void
  placeholder?: string
  className?: string
  'aria-invalid'?: boolean
}

export function DatePicker({ value, onChange, placeholder = 'Elegir fecha', className, ...rest }: DatePickerProps) {
  const selected = value ? parseISODate(value) : null
  const [open, setOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() => selected ?? new Date())

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const grid = getMonthGrid(year, month)
  const today = new Date()

  function goMonth(delta: number) {
    setViewDate(new Date(year, month + delta, 1))
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) setViewDate(selected ?? new Date())
  }

  function pick(d: Date) {
    onChange(toISODate(d))
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-invalid={rest['aria-invalid']}
          className={cn(
            'flex h-9 items-center gap-2 rounded-md border border-input bg-card px-3 py-1 text-sm shadow-xs',
            'focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring',
            'aria-invalid:border-destructive',
            selected ? 'text-foreground' : 'text-muted-foreground',
            className,
          )}
        >
          <Calendar className="h-3.5 w-3.5 shrink-0 opacity-60" />
          <span className="flex-1 text-left truncate">
            {selected ? DAY_LABEL.format(selected) : placeholder}
          </span>
          {selected && (
            <X
              className="h-3.5 w-3.5 shrink-0 hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                onChange(null)
              }}
            />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3">
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={() => goMonth(-1)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="text-sm font-semibold text-foreground capitalize">
            {MONTH_LABEL.format(viewDate)}
          </p>
          <button
            type="button"
            onClick={() => goMonth(1)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {WEEKDAYS.map((w, i) => (
            <span key={i} className="flex h-6 items-center justify-center text-[10px] font-medium text-muted-foreground">
              {w}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {grid.map((d, i) => {
            if (!d) return <span key={i} />
            const isSelected = selected && isSameDay(d, selected)
            const isToday = isSameDay(d, today)
            return (
              <button
                key={i}
                type="button"
                onClick={() => pick(d)}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-md text-xs transition-colors',
                  isSelected
                    ? 'bg-accent text-white font-semibold'
                    : isToday
                      ? 'text-accent font-semibold hover:bg-accent/10'
                      : 'text-foreground hover:bg-muted',
                )}
              >
                {d.getDate()}
              </button>
            )
          })}
        </div>

        {selected && (
          <button
            type="button"
            onClick={() => { onChange(null); setOpen(false) }}
            className="mt-2 w-full text-center text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            Quitar fecha
          </button>
        )}
      </PopoverContent>
    </Popover>
  )
}
