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
import { sileo } from 'sileo'
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
    try {
      await upsertMutation.mutateAsync({ id: color.id, nombre: trimmed, hex: color.hex ?? null, orden: color.orden })
      sileo.success({ title: 'Color renombrado' })
    } catch (err) {
      sileo.error({ title: 'Error al renombrar', description: err instanceof Error ? err.message : 'Intenta de nuevo' })
    }
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
    try {
      await upsertMutation.mutateAsync({
        nombre: nombre.trim(),
        hex: hex.trim() || null,
        orden: colors.length,
      })
      setNombre('')
      setHex('')
      sileo.success({ title: 'Color agregado' })
    } catch (err) {
      sileo.error({ title: 'Error al agregar color', description: err instanceof Error ? err.message : 'Intenta de nuevo' })
    }
  }

  return (
    <div className="space-y-3">
      <Label>Colores</Label>

      {colors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {colors.map((color) => (
            <div
              key={color.id}
              className="group flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm hover:border-foreground/30 transition-colors"
            >
              {color.hex && (
                <span
                  className="block h-4 w-4 rounded-full border border-black/15 shadow-sm shrink-0"
                  style={{ backgroundColor: color.hex }}
                />
              )}
              {editingId === color.id ? (
                <input
                  autoFocus
                  value={editingName}
                  maxLength={50}
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
                onClick={() => deleteMutation.mutate(color.id, {
                  onSuccess: () => sileo.success({ title: 'Color eliminado' }),
                  onError: (err) => sileo.error({ title: 'Error al eliminar', description: err.message }),
                })}
                disabled={deleteMutation.isPending && deleteMutation.variables === color.id}
                title="Eliminar color"
                className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-30"
              >
                <Trash2 className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      <div className="flex flex-wrap items-end gap-2.5 rounded-xl border border-border/50 bg-muted/20 p-3">
        <div className="flex flex-col gap-1 flex-1 min-w-24">
          <span className="text-[11px] font-medium text-muted-foreground">Nombre</span>
          <Input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="ej. Azul"
            maxLength={50}
            className="h-8 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
          />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-muted-foreground">Color (opcional)</span>
          <div className="flex items-center gap-1.5">
            <input
              type="color"
              value={hex || '#000000'}
              onChange={(e) => setHex(e.target.value)}
              title="Elegir color"
              className="h-8 w-8 cursor-pointer rounded-md border border-border p-0.5 bg-background"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={extracting}
              title="Extraer color de imagen"
              className="h-8 w-8 flex items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:text-foreground hover:border-foreground/50 transition-colors disabled:opacity-40"
            >
              {extracting
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Pipette className="h-3.5 w-3.5" />}
            </button>
            {hex && (
              <button
                type="button"
                onClick={() => setHex('')}
                title="Quitar color"
                className="h-8 px-2 rounded-md border border-border bg-background text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Quitar
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImagePick}
            />
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={handleAdd}
          disabled={!nombre.trim() || upsertMutation.isPending}
          className="h-8"
        >
          {upsertMutation.isPending
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Plus className="h-3.5 w-3.5" />}
          Agregar
        </Button>
      </div>
    </div>
  )
}
