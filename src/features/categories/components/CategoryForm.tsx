import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { generateSlug } from '@/lib/utils'
import type { Category } from '../api/categories.api'

const schema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  slug: z
    .string()
    .min(1, 'Slug requerido')
    .regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
})

type FormValues = z.infer<typeof schema>

interface CategoryFormProps {
  defaultValues?: Partial<Category>
  onSubmit: (values: FormValues) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function CategoryForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
}: CategoryFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: standardSchemaResolver(schema),
    defaultValues: {
      nombre: defaultValues?.nombre ?? '',
      slug: defaultValues?.slug ?? '',
    },
  })

  const nombre = watch('nombre')

  // Auto-generate slug from nombre only in create mode
  useEffect(() => {
    if (!defaultValues?.slug) {
      setValue('slug', generateSlug(nombre))
    }
  }, [nombre, defaultValues?.slug, setValue])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="nombre">Nombre</Label>
        <Input
          id="nombre"
          {...register('nombre')}
          placeholder="Escolar"
          aria-invalid={!!errors.nombre}
        />
        {errors.nombre && (
          <p className="text-xs text-destructive">{errors.nombre.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          {...register('slug')}
          placeholder="escolar"
          aria-invalid={!!errors.slug}
        />
        {errors.slug && (
          <p className="text-xs text-destructive">{errors.slug.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Guardando…' : 'Guardar'}
        </Button>
      </div>
    </form>
  )
}
