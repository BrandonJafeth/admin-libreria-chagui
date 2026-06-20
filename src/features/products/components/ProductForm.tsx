import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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

const schema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  slug: z
    .string()
    .min(1, 'Slug requerido')
    .regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
  precio: z.coerce
    .number({ invalid_type_error: 'Ingresa un precio válido' })
    .min(0, 'El precio no puede ser negativo'),
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
}

export function ProductForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
  submitLabel = 'Guardar',
}: ProductFormProps) {
  const { data: categories } = useCategories()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(schema),
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

  // Auto-generate slug from nombre only in create mode
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      {/* Nombre */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="nombre">Nombre</Label>
        <Input
          id="nombre"
          {...register('nombre')}
          placeholder="Lapicero azul x3"
          aria-invalid={!!errors.nombre}
        />
        {errors.nombre && (
          <p className="text-xs text-destructive">{errors.nombre.message}</p>
        )}
      </div>

      {/* Slug */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          {...register('slug')}
          placeholder="lapicero-azul-x3"
          aria-invalid={!!errors.slug}
        />
        {errors.slug && (
          <p className="text-xs text-destructive">{errors.slug.message}</p>
        )}
      </div>

      {/* Precio */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="precio">Precio (₡)</Label>
        <Input
          id="precio"
          type="number"
          min={0}
          {...register('precio')}
          onFocus={(e) => e.target.select()}
          className="max-w-48"
          aria-invalid={!!errors.precio}
        />
        {errors.precio && (
          <p className="text-xs text-destructive">{errors.precio.message}</p>
        )}
      </div>

      {/* Descripción */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="descripcion">Descripción</Label>
        <Textarea
          id="descripcion"
          {...register('descripcion')}
          placeholder="Descripción opcional del producto…"
          rows={3}
        />
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
                ? 'ring-1 ring-destructive/60 bg-destructive/5'
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
          {errors.category_ids && (
            <p className="text-xs text-destructive">Selecciona al menos una categoría</p>
          )}
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
