import { useRef } from 'react'
import { Trash2, Star, StarOff, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  useUploadProductImage,
  useDeleteProductImage,
  useSetMainImage,
} from '../hooks/useProductMutations'
import type { ProductImage } from '../api/products.api'

interface ImageUploaderProps {
  productId: string
  images: ProductImage[]
}

export function ImageUploader({ productId, images }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadMutation = useUploadProductImage(productId)
  const deleteMutation = useDeleteProductImage(productId)
  const setMainMutation = useSetMainImage(productId)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const orden = images.length
    const esPrincipal = images.length === 0

    await uploadMutation.mutateAsync({ file, orden, esPrincipal })
    e.target.value = ''
  }

  return (
    <div className="space-y-3">
      <Label>Imágenes</Label>

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((img) => (
            <div
              key={img.id}
              className="relative group rounded-lg overflow-hidden border border-border bg-muted aspect-square"
            >
              <img
                src={img.url}
                alt={img.alt ?? ''}
                className="w-full h-full object-cover"
              />

              {img.es_principal && (
                <span className="absolute top-1 left-1 rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  Principal
                </span>
              )}

              <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                {!img.es_principal && (
                  <button
                    onClick={() => setMainMutation.mutate(img.id)}
                    disabled={setMainMutation.isPending}
                    title="Marcar como principal"
                    className="rounded-full bg-white/90 p-1.5 text-foreground hover:bg-white transition-colors"
                  >
                    <Star className="h-3.5 w-3.5" />
                  </button>
                )}
                {img.es_principal && (
                  <span
                    title="Ya es principal"
                    className="rounded-full bg-accent/90 p-1.5 text-white"
                  >
                    <StarOff className="h-3.5 w-3.5" />
                  </span>
                )}
                <button
                  onClick={() =>
                    deleteMutation.mutate({ imageId: img.id, url: img.url })
                  }
                  disabled={deleteMutation.isPending}
                  title="Eliminar imagen"
                  className="rounded-full bg-white/90 p-1.5 text-destructive hover:bg-white transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadMutation.isPending}
        >
          <Upload className="h-4 w-4" />
          {uploadMutation.isPending ? 'Subiendo…' : 'Subir imagen'}
        </Button>
      </div>

      {images.length === 0 && (
        <p className="text-xs text-muted-foreground">
          La primera imagen subida será la principal automáticamente.
        </p>
      )}
    </div>
  )
}
