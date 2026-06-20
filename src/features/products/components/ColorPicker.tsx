import { useState, useRef } from 'react'
import { Plus, Trash2, Pipette, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  useUpsertProductColor,
  useDeleteProductColor,
} from '../hooks/useProductMutations'
import type { ProductColor } from '../api/products.api'
import { extractDominantColor } from '@/lib/colorExtractor'

interface ColorPickerProps {
  productId: string
  colors: ProductColor[]
}

export function ColorPicker({ productId, colors }: ColorPickerProps) {
  const [nombre, setNombre] = useState('')
  const [hex, setHex] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const upsertMutation = useUpsertProductColor(productId)
  const deleteMutation = useDeleteProductColor(productId)

  function startEdit(color: ProductColor) {
    setEditingId(color.id)
    setEditingName(color.nombre)
  }

  async function commitEdit(color: ProductColor) {
    const trimmed = editingName.trim()
    setEditingId(null)
    if (!trimmed || trimmed === color.nombre) return
    await upsertMutation.mutateAsync({ id: color.id, nombre: trimmed, hex: color.hex ?? null, orden: color.orden })
  }

  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setExtracting(true)
    try {
      const color = await extractDominantColor(file)
      setHex(color)
    } catch {
      // ignore
    } finally {
      setExtracting(false)
    }
  }

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
              {editingId === color.id ? (
                <input
                  autoFocus
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={() => commitEdit(color)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); commitEdit(color) }
                    if (e.key === 'Escape') { setEditingId(null) }
                  }}
                  className="w-20 bg-transparent outline-none text-sm"
                />
              ) : (
                <span
                  className="cursor-text hover:text-accent transition-colors"
                  onClick={() => startEdit(color)}
                  title="Click para editar"
                >
                  {color.nombre}
                </span>
              )}
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
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={extracting}
              title="Extraer color de imagen"
              className="h-8 w-8 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors disabled:opacity-40"
            >
              {extracting
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Pipette className="h-3.5 w-3.5" />}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImagePick}
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
