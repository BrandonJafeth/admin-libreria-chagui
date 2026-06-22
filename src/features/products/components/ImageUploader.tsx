import { useState, useEffect, useRef } from 'react'
import { Trash2, Star, Upload, GripVertical, Loader2 } from 'lucide-react'
import { Label } from '@/components/ui/label'
import {
  useUploadProductImage,
  useDeleteProductImage,
  useSetMainImage,
  useUpsertProductColor,
  useReorderImages,
} from '../hooks/useProductMutations'
import type { ProductImage } from '../api/products.api'
import { sileo } from 'sileo'
import { extractDominantColor } from '@/lib/colorExtractor'
import {
  draggable,
  dropTargetForElements,
  monitorForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { CropModal } from './CropModal'

interface ImageUploaderProps {
  productId: string
  images: ProductImage[]
  colorsCount?: number
}

export function ImageUploader({ productId, images, colorsCount = 0 }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [localImages, setLocalImages] = useState<ProductImage[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [isDragOver, setIsDragOver] = useState(false)
  const [cropQueue, setCropQueue] = useState<File[]>([])
  const [cropTotal, setCropTotal] = useState(0)

  const uploadMutation = useUploadProductImage(productId)
  const deleteMutation = useDeleteProductImage(productId)
  const setMainMutation = useSetMainImage(productId)
  const upsertColorMutation = useUpsertProductColor(productId)
  const reorderMutation = useReorderImages(productId)

  const localImagesRef = useRef(localImages)
  localImagesRef.current = localImages
  const reorderRef = useRef(reorderMutation.mutate)
  reorderRef.current = reorderMutation.mutate
  const colorsCountRef = useRef(colorsCount)
  colorsCountRef.current = colorsCount

  useEffect(() => {
    setLocalImages([...images].sort((a, b) => a.orden - b.orden))
  }, [images])

  useEffect(() => {
    return monitorForElements({
      onDrop({ source, location }) {
        const dest = location.current.dropTargets[0]
        if (!dest) return
        const srcId = source.data.id as string
        const dstId = dest.data.id as string
        if (srcId === dstId) return
        const imgs = localImagesRef.current
        const srcIdx = imgs.findIndex((i) => i.id === srcId)
        const dstIdx = imgs.findIndex((i) => i.id === dstId)
        if (srcIdx === -1 || dstIdx === -1) return
        const next = [...imgs]
        const [moved] = next.splice(srcIdx, 1)
        next.splice(dstIdx, 0, moved)
        setLocalImages(next)
        reorderRef.current(next.map((img, idx) => ({ id: img.id, orden: idx })))
      },
    })
  }, [])

  async function uploadFiles(files: FileList | File[]) {
    const arr = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (!arr.length) return
    setPendingCount((c) => c + arr.length)
    const baseOrden = localImagesRef.current.length
    let uploaded = 0

    await Promise.all(
      arr.map(async (file, i) => {
        try {
          await uploadMutation.mutateAsync({
            file,
            orden: baseOrden + i,
            esPrincipal: baseOrden === 0 && i === 0,
          })
          uploaded++
          extractDominantColor(file)
            .then((hex) =>
              upsertColorMutation.mutate({
                nombre: `Color ${colorsCountRef.current + baseOrden + i + 1}`,
                hex,
                orden: colorsCountRef.current + baseOrden + i,
              }),
            )
            .catch(() => {})
        } finally {
          setPendingCount((c) => c - 1)
        }
      }),
    )
    if (uploaded > 0) {
      sileo.success({ title: `${uploaded} imagen${uploaded !== 1 ? 'es' : ''} subida${uploaded !== 1 ? 's' : ''}` })
    }
  }

  function startCropQueue(files: FileList | File[]) {
    const arr = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (!arr.length) return
    setCropTotal(arr.length)
    setCropQueue(arr)
  }

  async function handleCropConfirm(croppedFile: File) {
    try {
      await uploadFiles([croppedFile])
    } catch {
      sileo.error({ title: 'Error al subir imagen', description: 'No se pudo subir. Intenta de nuevo.' })
    } finally {
      setCropQueue((q) => q.slice(1))
    }
  }

  async function handleCropSkip(originalFile: File) {
    try {
      await uploadFiles([originalFile])
    } catch {
      sileo.error({ title: 'Error al subir imagen', description: 'No se pudo subir. Intenta de nuevo.' })
    } finally {
      setCropQueue((q) => q.slice(1))
    }
  }

  function handleCropCancel() {
    setCropQueue([])
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) {
      startCropQueue(e.target.files)
      e.target.value = ''
    }
  }

  function handleDragOver(e: React.DragEvent) {
    if (!e.dataTransfer.types.includes('Files')) return
    e.preventDefault()
    setIsDragOver(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragOver(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files.length) startCropQueue(e.dataTransfer.files)
  }

  return (
    <div className="space-y-3">
      <Label>Imágenes</Label>

      {localImages.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {localImages.map((img) => (
            <DraggableImageCard
              key={img.id}
              image={img}
              onSetMain={() => setMainMutation.mutate(img.id, {
                onSuccess: () => sileo.success({ title: 'Imagen principal actualizada' }),
                onError: (err) => sileo.error({ title: 'Error', description: err.message }),
              })}
              onDelete={() => {
                const wasPrincipal = img.es_principal
                const nextPrincipal = localImages.find((i) => i.id !== img.id)
                deleteMutation.mutate({ imageId: img.id, url: img.url }, {
                  onSuccess: () => {
                    sileo.success({ title: 'Imagen eliminada' })
                    if (wasPrincipal && nextPrincipal) {
                      setMainMutation.mutate(nextPrincipal.id)
                    }
                  },
                  onError: (err) => sileo.error({ title: 'Error al eliminar', description: err.message }),
                })
              }}
              isDeleting={deleteMutation.isPending && (deleteMutation.variables as { imageId: string })?.imageId === img.id}
              isSettingMain={setMainMutation.isPending && setMainMutation.variables === img.id}
            />
          ))}
        </div>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => pendingCount === 0 && fileInputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 transition-colors select-none ${
          pendingCount > 0
            ? 'border-border cursor-default'
            : isDragOver
              ? 'border-accent bg-accent/5 text-accent cursor-copy'
              : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground cursor-pointer'
        }`}
      >
        {pendingCount > 0 ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin text-accent" />
            <p className="text-sm font-medium text-foreground">
              Subiendo {pendingCount} imagen{pendingCount !== 1 ? 'es' : ''}…
            </p>
          </>
        ) : (
          <>
            <Upload className="h-5 w-5" />
            <p className="text-sm font-medium">
              {isDragOver ? 'Suelta aquí' : 'Arrastra imágenes o haz click'}
            </p>
            <p className="text-xs opacity-60">Puedes subir varias a la vez</p>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {localImages.length === 0 && pendingCount === 0 && (
        <p className="text-xs text-muted-foreground">
          La primera imagen subida será la principal automáticamente.
        </p>
      )}

      {cropQueue.length > 0 && (
        <CropModal
          key={cropTotal - cropQueue.length}
          file={cropQueue[0]}
          current={cropTotal - cropQueue.length + 1}
          total={cropTotal}
          isUploading={pendingCount > 0}
          onConfirm={handleCropConfirm}
          onSkip={handleCropSkip}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  )
}

// ─── Draggable Image Card ────────────────────────────────────────────────────

interface DraggableImageCardProps {
  image: ProductImage
  onSetMain: () => void
  onDelete: () => void
  isDeleting: boolean
  isSettingMain: boolean
}

function DraggableImageCard({
  image,
  onSetMain,
  onDelete,
  isDeleting,
  isSettingMain,
}: DraggableImageCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const [isOver, setIsOver] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const cleanup1 = draggable({
      element: el,
      getInitialData: () => ({ id: image.id }),
      onDragStart: () => setDragging(true),
      onDrop: () => setDragging(false),
    })
    const cleanup2 = dropTargetForElements({
      element: el,
      getData: () => ({ id: image.id }),
      onDragEnter: () => setIsOver(true),
      onDragLeave: () => setIsOver(false),
      onDrop: () => setIsOver(false),
    })
    return () => {
      cleanup1()
      cleanup2()
    }
  }, [image.id])

  return (
    <div
      ref={ref}
      className={`relative rounded-xl overflow-hidden border transition-all duration-150 ${
        dragging
          ? 'opacity-30 scale-95'
          : isOver
            ? 'border-accent ring-2 ring-accent/30'
            : 'border-border'
      }`}
    >
      {/* Image */}
      <div className="relative aspect-square bg-muted overflow-hidden cursor-grab active:cursor-grabbing">
        <img src={image.url} alt={image.alt ?? ''} className="w-full h-full object-cover" />
      </div>

      {/* Drag handle — top right */}
      <div className="absolute top-2 right-2 z-10 rounded-md bg-black/35 p-1 pointer-events-none backdrop-blur-sm">
        <GripVertical className="h-3.5 w-3.5 text-white/80" />
      </div>

      {/* Bottom row: star action + delete */}
      <div className="absolute bottom-0 inset-x-0 z-10 flex items-center justify-between px-2 py-2">
        {/* Star / principal button */}
        {image.es_principal ? (
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full bg-accent shadow-md"
            title="Imagen principal"
          >
            <Star className="h-3.5 w-3.5 text-white" fill="currentColor" />
          </div>
        ) : (
          <button
            onClick={onSetMain}
            disabled={isSettingMain}
            title="Establecer como principal"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-amber-400 transition-colors disabled:opacity-40 shadow-md active:scale-95"
          >
            {isSettingMain
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Star className="h-3.5 w-3.5" />}
          </button>
        )}

        {/* Delete button */}
        <button
          onClick={onDelete}
          disabled={isDeleting}
          title="Eliminar imagen"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-red-500 transition-colors disabled:opacity-40 shadow-md active:scale-95"
        >
          {isDeleting
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Trash2 className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  )
}
