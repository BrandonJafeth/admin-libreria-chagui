import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { z } from 'zod'
import { AlertCircle, AlertTriangle, XCircle, Tag, Coins, FileText, Megaphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RichEditor } from '@/components/ui/rich-editor'
import { Switch } from '@/components/ui/switch'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { generateSlug, formatPrice } from '@/lib/utils'
import { precioFinal } from '@/lib/pricing'
import { useCategories } from '@/features/categories/hooks/useCategories'
import type { Product } from '../api/products.api'

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="flex items-center gap-1.5 text-xs font-medium text-destructive" role="alert">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      {message}
    </p>
  )
}

function FormSection({
  icon, title, children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border/50 bg-muted/20 p-4">
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-foreground/70">
        {icon}
        {title}
      </p>
      {children}
    </div>
  )
}

const NOMBRE_MAX = 120
const SLUG_MAX = 120
const DESC_VISIBLE_MAX = 800
const PRECIO_MAX = 9_999_999

const schema = z
  .object({
    nombre: z
      .string()
      .min(1, 'Nombre requerido')
      .max(NOMBRE_MAX, `Máximo ${NOMBRE_MAX} caracteres`),
    slug: z
      .string()
      .min(1, 'Slug requerido')
      .max(SLUG_MAX, `Máximo ${SLUG_MAX} caracteres`)
      .regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
    precio: z.coerce
      .number({ error: 'Ingresa un precio válido' })
      .min(1, 'El precio debe ser mayor a 0')
      .max(PRECIO_MAX, `Precio máximo: ₡${PRECIO_MAX.toLocaleString('es-CR')}`),
    descripcion: z.string().default(''),
    estado: z.enum(['disponible', 'agotado']),
    destacado: z.boolean().default(false),
    tipo: z.enum(['simple', 'paquete']).default('simple'),
    category_ids: z.array(z.string()).min(1, 'Selecciona al menos una categoría'),
    descuento_tipo: z.enum(['ninguno', 'precio_fijo', 'porcentaje']).default('ninguno'),
    precio_oferta: z.coerce.number().nullable().optional(),
    descuento_porcentaje: z.coerce.number().nullable().optional(),
    descuento_activo: z.boolean().default(true),
    descuento_inicio: z.string().nullable().optional(),
    descuento_fin: z.string().nullable().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.descuento_tipo === 'precio_fijo') {
      if (val.precio_oferta == null || val.precio_oferta <= 0) {
        ctx.addIssue({ code: 'custom', path: ['precio_oferta'], message: 'Ingresa el precio de oferta' })
      } else if (val.precio_oferta >= val.precio) {
        ctx.addIssue({ code: 'custom', path: ['precio_oferta'], message: 'Debe ser menor al precio normal' })
      }
    }
    if (val.descuento_tipo === 'porcentaje') {
      if (val.descuento_porcentaje == null || val.descuento_porcentaje <= 0 || val.descuento_porcentaje > 100) {
        ctx.addIssue({ code: 'custom', path: ['descuento_porcentaje'], message: 'Debe ser un valor entre 1 y 100' })
      }
    }
    if (val.descuento_inicio && val.descuento_fin && val.descuento_fin < val.descuento_inicio) {
      ctx.addIssue({ code: 'custom', path: ['descuento_fin'], message: 'Debe ser posterior a la fecha de inicio' })
    }
  })

type RawFormValues = z.infer<typeof schema>

// Shape que recibe onSubmit: descuento_tipo ya normalizado a null (no 'ninguno'),
// fechas ya convertidas a ISO — listo para mandar directo a Supabase.
export type ProductFormValues = Omit<
  RawFormValues,
  'descuento_tipo' | 'precio_oferta' | 'descuento_porcentaje' | 'descuento_inicio' | 'descuento_fin'
> & {
  descuento_tipo: 'precio_fijo' | 'porcentaje' | null
  precio_oferta: number | null
  descuento_porcentaje: number | null
  descuento_inicio: string | null
  descuento_fin: string | null
}

// input type="date" (YYYY-MM-DD, hora local) ⇄ timestamptz ISO — evita el off-by-one
// clásico de interpretar la fecha en UTC en vez de la zona horaria del navegador.
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

interface ProductFormProps {
  defaultValues?: Partial<Product & { category_ids: string[] }>
  onSubmit: (values: ProductFormValues) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
  submitLabel?: string
  apiError?: string
  bundleItemsCount?: number
}

export function ProductForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
  submitLabel = 'Guardar',
  apiError,
  bundleItemsCount = 0,
}: ProductFormProps) {
  const { data: categories } = useCategories()
  const [validationFailed, setValidationFailed] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<RawFormValues>({
    resolver: standardSchemaResolver(schema),
    mode: 'onBlur',
    defaultValues: {
      nombre: defaultValues?.nombre ?? '',
      slug: defaultValues?.slug ?? '',
      precio: defaultValues?.precio ?? 0,
      descripcion: defaultValues?.descripcion ?? '',
      estado: defaultValues?.estado ?? 'disponible',
      destacado: defaultValues?.destacado ?? false,
      tipo: defaultValues?.tipo ?? 'simple',
      category_ids: defaultValues?.category_ids ?? [],
      descuento_tipo: defaultValues?.descuento_tipo ?? 'ninguno',
      precio_oferta: defaultValues?.precio_oferta ?? null,
      descuento_porcentaje: defaultValues?.descuento_porcentaje ?? null,
      descuento_activo: defaultValues?.descuento_activo ?? true,
      descuento_inicio: isoToDateInput(defaultValues?.descuento_inicio),
      descuento_fin: isoToDateInput(defaultValues?.descuento_fin),
    },
  })

  const nombre = watch('nombre')
  const slug = watch('slug')
  const categoryIds = watch('category_ids')
  const bloqueadoPorComponentes = defaultValues?.tipo === 'paquete' && bundleItemsCount > 0
  const precio = watch('precio')
  const descuentoTipo = watch('descuento_tipo')
  const precioOferta = watch('precio_oferta')
  const descuentoPorcentaje = watch('descuento_porcentaje')

  useEffect(() => {
    setValue('slug', generateSlug(nombre))
  }, [nombre, setValue])

  // Al cambiar de tipo de descuento, limpiar el campo que ya no aplica
  // para no mandar un valor viejo oculto al guardar.
  useEffect(() => {
    if (descuentoTipo === 'precio_fijo') setValue('descuento_porcentaje', null)
    if (descuentoTipo === 'porcentaje') setValue('precio_oferta', null)
    if (descuentoTipo === 'ninguno') {
      setValue('precio_oferta', null)
      setValue('descuento_porcentaje', null)
    }
  }, [descuentoTipo, setValue])

  function toggleCategory(id: string) {
    const next = categoryIds.includes(id)
      ? categoryIds.filter((c) => c !== id)
      : [...categoryIds, id]
    setValue('category_ids', next, { shouldValidate: true })
  }

  const precioFinalPreview = precioFinal({
    precio: precio || 0,
    descuento_tipo: descuentoTipo === 'ninguno' ? null : descuentoTipo,
    precio_oferta: precioOferta ?? null,
    descuento_porcentaje: descuentoPorcentaje ?? null,
    descuento_activo: true,
    descuento_inicio: null,
    descuento_fin: null,
  })
  const hayAhorro = descuentoTipo !== 'ninguno' && precioFinalPreview < (precio || 0)

  async function handleValid(raw: RawFormValues) {
    setValidationFailed(false)
    const descuento_tipo = raw.descuento_tipo === 'ninguno' ? null : raw.descuento_tipo
    const values: ProductFormValues = {
      ...raw,
      descuento_tipo,
      precio_oferta: descuento_tipo === 'precio_fijo' ? raw.precio_oferta ?? null : null,
      descuento_porcentaje: descuento_tipo === 'porcentaje' ? raw.descuento_porcentaje ?? null : null,
      descuento_inicio: dateInputToISO(raw.descuento_inicio, false),
      descuento_fin: dateInputToISO(raw.descuento_fin, true),
    }
    await onSubmit(values)
  }

  function handleInvalid() {
    setValidationFailed(true)
  }

  return (
    <form onSubmit={handleSubmit(handleValid, handleInvalid)} className="flex flex-col gap-5">

      {/* Banner validación — aparece garantizado cuando RHF llama onInvalid */}
      {validationFailed && (
        <div
          className="flex items-start gap-3 rounded-lg border-2 border-destructive bg-destructive/10 px-4 py-3"
          role="alert"
        >
          <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-destructive">Revisa el formulario</p>
            <p className="text-xs text-destructive mt-0.5">Corrige los campos marcados en rojo para continuar.</p>
          </div>
        </div>
      )}

      {/* Banner error API */}
      {apiError && (
        <div
          className="flex items-start gap-3 rounded-lg border-2 border-destructive bg-destructive/10 px-4 py-3"
          role="alert"
        >
          <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-destructive">No se pudo guardar</p>
            <p className="text-xs text-destructive mt-0.5">{apiError}</p>
          </div>
        </div>
      )}

      {/* Nombre — campo principal, sin caja, encabeza el formulario */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="nombre">
            Nombre <span className="text-destructive">*</span>
          </Label>
          <span className={`text-[11px] tabular-nums ${(nombre?.length ?? 0) > NOMBRE_MAX * 0.9 ? 'text-destructive' : 'text-muted-foreground'}`}>
            {nombre?.length ?? 0}/{NOMBRE_MAX}
          </span>
        </div>
        <Input
          id="nombre"
          {...register('nombre')}
          placeholder="Lapicero azul x3"
          maxLength={NOMBRE_MAX}
          aria-invalid={!!errors.nombre}
        />
        <FieldError message={errors.nombre?.message} />
        {/* Slug: generado solo, se muestra como referencia — no se edita a mano */}
        <p className="text-[11px] text-muted-foreground/70 font-mono truncate">
          /productos/{slug || '…'}
        </p>
        <input type="hidden" {...register('slug')} maxLength={SLUG_MAX} />
      </div>

      {/* Clasificación: tipo + categorías */}
      <FormSection icon={<Tag className="h-3.5 w-3.5" />} title="Clasificación">
        <div className="flex flex-col gap-1.5">
          <Label>Tipo de producto</Label>
          <Controller
            name="tipo"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-56 bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple" disabled={bloqueadoPorComponentes}>
                    Producto simple
                  </SelectItem>
                  <SelectItem value="paquete">Paquete</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {bloqueadoPorComponentes ? (
            <div className="flex items-start gap-2 rounded-lg border border-accent-3/40 bg-accent-3/10 px-3 py-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-[hsl(30,65%,35%)]" />
              <p className="text-[11.5px] leading-relaxed text-[hsl(30,65%,30%)]">
                No se puede cambiar a producto simple: tiene {bundleItemsCount} componente{bundleItemsCount !== 1 ? 's' : ''} agregado{bundleItemsCount !== 1 ? 's' : ''}.
                {' '}Quita{bundleItemsCount !== 1 ? 'los' : 'lo'} desde "Componentes del paquete" más abajo para poder cambiarlo.
              </p>
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground">
              Un paquete agrupa varios productos a un precio propio — los componentes se agregan después de guardar.
            </p>
          )}
        </div>

        {categories && categories.length > 0 && (
          <div className="flex flex-col gap-2">
            <Label>
              Categorías <span className="text-destructive">*</span>
            </Label>
            <div
              className={`flex flex-wrap gap-2 rounded-lg p-2 transition-colors ${
                errors.category_ids
                  ? 'ring-2 ring-destructive bg-destructive/5'
                  : 'ring-0'
              }`}
            >
              {categories.map((cat) => {
                const selected = categoryIds.includes(cat.id)
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      selected
                        ? 'bg-accent text-white border-accent'
                        : 'border-border bg-card text-muted-foreground hover:border-foreground hover:text-foreground'
                    }`}
                  >
                    {cat.nombre}
                  </button>
                )
              })}
            </div>
            <FieldError message={errors.category_ids ? 'Selecciona al menos una categoría' : undefined} />
          </div>
        )}
      </FormSection>

      {/* Precio + descuento */}
      <FormSection icon={<Coins className="h-3.5 w-3.5" />} title="Precio">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="precio">
            Precio (₡) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="precio"
            type="number"
            min={1}
            max={PRECIO_MAX}
            {...register('precio')}
            onFocus={(e) => e.target.select()}
            className="max-w-48 bg-card"
            aria-invalid={!!errors.precio}
          />
          <FieldError message={errors.precio?.message} />
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-card p-3">
          <div className="flex flex-col gap-1.5">
            <Label>Descuento</Label>
            <Controller
              name="descuento_tipo"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="max-w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ninguno">Sin descuento</SelectItem>
                    <SelectItem value="precio_fijo">Precio fijo</SelectItem>
                    <SelectItem value="porcentaje">Porcentaje</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {descuentoTipo === 'precio_fijo' && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="precio_oferta">Precio de oferta (₡)</Label>
              <Input
                id="precio_oferta"
                type="number"
                min={1}
                {...register('precio_oferta')}
                onFocus={(e) => e.target.select()}
                className="max-w-48"
                aria-invalid={!!errors.precio_oferta}
              />
              <FieldError message={errors.precio_oferta?.message} />
            </div>
          )}

          {descuentoTipo === 'porcentaje' && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="descuento_porcentaje">Porcentaje de descuento (%)</Label>
              <Input
                id="descuento_porcentaje"
                type="number"
                min={1}
                max={100}
                {...register('descuento_porcentaje')}
                onFocus={(e) => e.target.select()}
                className="max-w-48"
                aria-invalid={!!errors.descuento_porcentaje}
              />
              <FieldError message={errors.descuento_porcentaje?.message} />
            </div>
          )}

          {descuentoTipo !== 'ninguno' && (
            <>
              <p className="text-sm">
                Precio final:{' '}
                <span className="font-semibold text-accent">{formatPrice(precioFinalPreview)}</span>
                {hayAhorro && (
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    (antes {formatPrice(precio || 0)})
                  </span>
                )}
              </p>

              <div className="flex items-center gap-3">
                <Controller
                  name="descuento_activo"
                  control={control}
                  render={({ field }) => (
                    <Switch id="descuento_activo" checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
                <Label htmlFor="descuento_activo">Descuento activo</Label>
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label>Desde (opcional)</Label>
                  <Controller
                    name="descuento_inicio"
                    control={control}
                    render={({ field }) => (
                      <DatePicker value={field.value} onChange={field.onChange} className="w-40" />
                    )}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Hasta (opcional)</Label>
                  <Controller
                    name="descuento_fin"
                    control={control}
                    render={({ field }) => (
                      <DatePicker value={field.value} onChange={field.onChange} className="w-40" aria-invalid={!!errors.descuento_fin} />
                    )}
                  />
                  <FieldError message={errors.descuento_fin?.message} />
                </div>
              </div>
            </>
          )}
        </div>
      </FormSection>

      {/* Descripción */}
      <FormSection icon={<FileText className="h-3.5 w-3.5" />} title="Descripción">
        <Controller
          name="descripcion"
          control={control}
          render={({ field }) => (
            <RichEditor
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              placeholder="Descripción opcional del producto…"
              visibleMax={DESC_VISIBLE_MAX}
              aria-invalid={!!errors.descripcion}
            />
          )}
        />
        <FieldError message={errors.descripcion?.message} />
      </FormSection>

      {/* Publicación: estado + destacado juntos, misma decisión conceptual */}
      <FormSection icon={<Megaphone className="h-3.5 w-3.5" />} title="Publicación">
        <div className="flex flex-wrap items-end gap-6">
          <div className="flex flex-col gap-1.5">
            <Label>Estado</Label>
            <Controller
              name="estado"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-40 bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disponible">Disponible</SelectItem>
                    <SelectItem value="agotado">Agotado</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="flex items-center gap-3 pb-2">
            <Controller
              name="destacado"
              control={control}
              render={({ field }) => (
                <Switch
                  id="destacado"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="destacado">Destacado en home</Label>
          </div>
        </div>
      </FormSection>

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
