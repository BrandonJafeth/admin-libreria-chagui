import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  useUpsertProductColor,
  useDeleteProductColor,
} from '../hooks/useProductMutations'
import type { ProductColor } from '../api/products.api'

interface ColorPickerProps {
  productId: string
  colors: ProductColor[]
}

export function ColorPicker({ productId, colors }: ColorPickerProps) {
  const [nombre, setNombre] = useState('')
  const [hex, setHex] = useState('')

  const upsertMutation = useUpsertProductColor(productId)
  const deleteMutation = useDeleteProductColor(productId)

  async function handleAdd() {
    if (!nombre.trim()) return
    await upsertMutation.mutateAsync({
      nombre: nombre.trim(),
      hex: hex.trim() || null,
      orden: colors.length,
    })
    setNombre('')
    setHex('')
  }

  return (
    <div className="space-y-3">
      <Label>Colores</Label>

      {colors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {colors.map((color) => (
            <div
              key={color.id}
              className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm"
            >
              {color.hex && (
                <span
                  className="block h-3.5 w-3.5 rounded-full border border-black/10 shrink-0"
                  style={{ backgroundColor: color.hex }}
                />
              )}
              <span>{color.nombre}</span>
              <button
                onClick={() => deleteMutation.mutate(color.id)}
                disabled={deleteMutation.isPending}
                className="text-muted-foreground hover:text-destructive transition-colors ml-1"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      <div className="flex items-end gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Nombre</span>
          <Input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Azul"
            className="w-28"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Hex (opcional)</span>
          <div className="flex items-center gap-1">
            {hex && (
              <span
                className="block h-8 w-8 rounded-md border border-black/10 shrink-0"
                style={{ backgroundColor: hex }}
              />
            )}
            <Input
              type="color"
              value={hex || '#000000'}
              onChange={(e) => setHex(e.target.value)}
              className="w-10 h-8 p-0.5 cursor-pointer"
            />
            {hex && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setHex('')}
                className="h-8 px-2 text-xs"
              >
                Quitar
              </Button>
            )}
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={handleAdd}
          disabled={!nombre.trim() || upsertMutation.isPending}
        >
          <Plus className="h-4 w-4" />
          Agregar
        </Button>
      </div>
    </div>
  )
}
