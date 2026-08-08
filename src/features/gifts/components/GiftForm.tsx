import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { z } from 'zod'
import { AlertCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { DatePicker } from '@/components/ui/date-picker'
import { ProductPicker } from '@/components/ui/product-picker'
import type { Gift } from '../api/gifts.api'

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="flex items-center gap-1.5 text-xs font-medium text-destructive" role="alert">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      {message}
    </p>
  )
}

const MENSAJE_MAX = 200

const schema = z
  .object({
    producto_disparador_id: z.string().min(1, 'Selecciona el producto disparador'),
    producto_regalo_id: z.string().min(1, 'Selecciona el producto de regalo'),
    cantidad_regalo: z.coerce.number().int('Debe ser un número entero').min(1, 'Debe ser al menos 1'),
    mensaje: z.string().min(1, 'Ingresa el mensaje').max(MENSAJE_MAX, `Máximo ${MENSAJE_MAX} caracteres`),
    activo: z.boolean().default(true),
    fecha_inicio: z.string().nullable().optional(),
    fecha_fin: z.string().nullable().optional(),
  })
  .superRefine((val, ctx) => {
    // product_gifts tiene CHECK (producto_disparador_id <> producto_regalo_id) en DB
    // (supabase/migrations/20260807000000_discounts_bundles_gifts.sql) — validar acá
    // también para no dejar que el usuario llegue a un error crudo de Postgres.
    if (val.producto_disparador_id && val.producto_disparador_id === val.producto_regalo_id) {
      ctx.addIssue({ code: 'custom', path: ['producto_regalo_id'], message: 'Debe ser distinto al producto disparador' })
    }
    if (val.fecha_inicio && val.fecha_fin && val.fecha_fin < val.fecha_inicio) {
      ctx.addIssue({ code: 'custom', path: ['fecha_fin'], message: 'Debe ser posterior a la fecha de inicio' })
    }
  })

type RawFormValues = z.infer<typeof schema>

export type GiftFormValues = Omit<RawFormValues, 'fecha_inicio' | 'fecha_fin'> & {
  fecha_inicio: string | null
  fecha_fin: string | null
}

// Mismo par de helpers que ProductForm.tsx (descuentos) — input type="date" (YYYY-MM-DD,
// hora local) ⇄ timestamptz ISO, evita el off-by-one de interpretar la fecha en UTC.
function dateInputToISO(value: string | null | undefined, endOfDay: boolean): string | null {
  if (!value) return null
  const suffix = endOfDay ? 'T23:59:59' : 'T00:00:00'
  return new Date(`${value}${suffix}`).toISOString()
}

function isoToDateInput(iso: string | null | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

interface GiftFormProps {
  defaultValues?: Partial<Gift>
  onSubmit: (values: GiftFormValues) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
  submitLabel?: string
  apiError?: string
}

export function GiftForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
  submitLabel = 'Guardar',
  apiError,
}: GiftFormProps) {
  const [validationFailed, setValidationFailed] = useState(false)

  const {
    handleSubmit,
    register,
    watch,
    control,
    formState: { errors },
  } = useForm<RawFormValues>({
    resolver: standardSchemaResolver(schema),
    mode: 'onBlur',
    defaultValues: {
      producto_disparador_id: defaultValues?.producto_disparador_id ?? '',
      producto_regalo_id: defaultValues?.producto_regalo_id ?? '',
      cantidad_regalo: defaultValues?.cantidad_regalo ?? 1,
      mensaje: defaultValues?.mensaje ?? '',
      activo: defaultValues?.activo ?? true,
      fecha_inicio: isoToDateInput(defaultValues?.fecha_inicio),
      fecha_fin: isoToDateInput(defaultValues?.fecha_fin),
    },
  })

  const mensaje = watch('mensaje')
  const disparadorId = watch('producto_disparador_id')
  const regaloId = watch('producto_regalo_id')

  async function handleValid(raw: RawFormValues) {
    setValidationFailed(false)
    const values: GiftFormValues = {
      ...raw,
      fecha_inicio: dateInputToISO(raw.fecha_inicio, false),
      fecha_fin: dateInputToISO(raw.fecha_fin, true),
    }
    await onSubmit(values)
  }

  function handleInvalid() {
    setValidationFailed(true)
  }

  return (
    <form onSubmit={handleSubmit(handleValid, handleInvalid)} className="flex flex-col gap-5">
      {validationFailed && (
        <div className="flex items-start gap-3 rounded-lg border-2 border-destructive bg-destructive/10 px-4 py-3" role="alert">
          <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-destructive">Revisa el formulario</p>
            <p className="text-xs text-destructive mt-0.5">Corrige los campos marcados en rojo para continuar.</p>
          </div>
        </div>
      )}

      {apiError && (
        <div className="flex items-start gap-3 rounded-lg border-2 border-destructive bg-destructive/10 px-4 py-3" role="alert">
          <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-destructive">No se pudo guardar</p>
            <p className="text-xs text-destructive mt-0.5">{apiError}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label>Producto disparador</Label>
        <p className="text-[11px] text-muted-foreground -mt-1">Al comprar este producto, se regala el de abajo.</p>
        <Controller
          name="producto_disparador_id"
          control={control}
          render={({ field }) => (
            <ProductPicker
              value={field.value || null}
              onChange={(id) => field.onChange(id ?? '')}
              excludeIds={regaloId ? [regaloId] : []}
            />
          )}
        />
        <FieldError message={errors.producto_disparador_id?.message} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Producto de regalo</Label>
        <Controller
          name="producto_regalo_id"
          control={control}
          render={({ field }) => (
            <ProductPicker
              value={field.value || null}
              onChange={(id) => field.onChange(id ?? '')}
              excludeIds={disparadorId ? [disparadorId] : []}
            />
          )}
        />
        <FieldError message={errors.producto_regalo_id?.message} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cantidad_regalo">Cantidad de regalo</Label>
        <Input
          id="cantidad_regalo"
          type="number"
          min={1}
          step={1}
          {...register('cantidad_regalo')}
          onFocus={(e) => e.target.select()}
          className="max-w-32"
          aria-invalid={!!errors.cantidad_regalo}
        />
        <FieldError message={errors.cantidad_regalo?.message} />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="mensaje">Mensaje</Label>
          <span className={`text-[11px] tabular-nums ${(mensaje?.length ?? 0) > MENSAJE_MAX * 0.9 ? 'text-destructive' : 'text-muted-foreground'}`}>
            {mensaje?.length ?? 0}/{MENSAJE_MAX}
          </span>
        </div>
        <Textarea
          id="mensaje"
          {...register('mensaje')}
          placeholder="¡Con este producto te regalamos un borrador!"
          maxLength={MENSAJE_MAX}
          rows={2}
          aria-invalid={!!errors.mensaje}
        />
        <FieldError message={errors.mensaje?.message} />
      </div>

      <div className="flex items-center gap-3">
        <Controller
          name="activo"
          control={control}
          render={({ field }) => (
            <Switch id="activo" checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
        <Label htmlFor="activo">Regla activa</Label>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Desde (opcional)</Label>
          <Controller
            name="fecha_inicio"
            control={control}
            render={({ field }) => (
              <DatePicker value={field.value} onChange={field.onChange} className="w-40" />
            )}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Hasta (opcional)</Label>
          <Controller
            name="fecha_fin"
            control={control}
            render={({ field }) => (
              <DatePicker value={field.value} onChange={field.onChange} className="w-40" aria-invalid={!!errors.fecha_fin} />
            )}
          />
          <FieldError message={errors.fecha_fin?.message} />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Guardando…' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
