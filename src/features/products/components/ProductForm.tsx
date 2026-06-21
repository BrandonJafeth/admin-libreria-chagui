import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { z } from 'zod'
import { AlertCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RichEditor } from '@/components/ui/rich-editor'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { generateSlug } from '@/lib/utils'
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

const NOMBRE_MAX = 120
const SLUG_MAX = 120
const DESC_VISIBLE_MAX = 800
const PRECIO_MAX = 9_999_999

const schema = z.object({
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
  category_ids: z.array(z.string()).min(1, 'Selecciona al menos una categoría'),
})

export type ProductFormValues = z.infer<typeof schema>

interface ProductFormProps {
  defaultValues?: Partial<Product & { category_ids: string[] }>
  onSubmit: (values: ProductFormValues) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
  submitLabel?: string
  apiError?: string
}

export function ProductForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
  submitLabel = 'Guardar',
  apiError,
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
  } = useForm<ProductFormValues>({
    resolver: standardSchemaResolver(schema),
    mode: 'onBlur',
    defaultValues: {
      nombre: defaultValues?.nombre ?? '',
      slug: defaultValues?.slug ?? '',
      precio: defaultValues?.precio ?? 0,
      descripcion: defaultValues?.descripcion ?? '',
      estado: defaultValues?.estado ?? 'disponible',
      destacado: defaultValues?.destacado ?? false,
      category_ids: defaultValues?.category_ids ?? [],
    },
  })

  const nombre = watch('nombre')
  const categoryIds = watch('category_ids')

  useEffect(() => {
    if (!defaultValues?.slug) {
      setValue('slug', generateSlug(nombre))
    }
  }, [nombre, defaultValues?.slug, setValue])

  function toggleCategory(id: string) {
    const next = categoryIds.includes(id)
      ? categoryIds.filter((c) => c !== id)
      : [...categoryIds, id]
    setValue('category_ids', next, { shouldValidate: true })
  }

  async function handleValid(values: ProductFormValues) {
    setValidationFailed(false)
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

      {/* Nombre */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="nombre">Nombre</Label>
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
      </div>

      {/* Slug */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          {...register('slug')}
          placeholder="lapicero-azul-x3"
          maxLength={SLUG_MAX}
          aria-invalid={!!errors.slug}
        />
        <FieldError message={errors.slug?.message} />
      </div>

      {/* Precio */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="precio">Precio (₡)</Label>
        <Input
          id="precio"
          type="number"
          min={1}
          max={PRECIO_MAX}
          {...register('precio')}
          onFocus={(e) => e.target.select()}
          className="max-w-48"
          aria-invalid={!!errors.precio}
        />
        <FieldError message={errors.precio?.message} />
      </div>

      {/* Descripción */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="descripcion">Descripción</Label>
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
      </div>

      {/* Estado */}
      <div className="flex flex-col gap-1.5">
        <Label>Estado</Label>
        <Controller
          name="estado"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="max-w-48">
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

      {/* Destacado */}
      <div className="flex items-center gap-3">
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

      {/* Categorías */}
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
                      : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
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
