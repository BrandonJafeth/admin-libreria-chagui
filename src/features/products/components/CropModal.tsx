import { useState, useRef, useEffect } from 'react'
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
} from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Button } from '@/components/ui/button'
import { Crop as CropIcon, RotateCcw, RotateCw, Loader2 } from 'lucide-react'

interface CropModalProps {
  file: File
  current: number
  total: number
  isUploading: boolean
  onConfirm: (croppedFile: File) => void
  onSkip: (originalFile: File) => void
  onCancel: () => void
}

export function CropModal({
  file,
  current,
  total,
  isUploading,
  onConfirm,
  onSkip,
  onCancel,
}: CropModalProps) {
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [displayUrl, setDisplayUrl] = useState('')
  const [isRotating, setIsRotating] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const rotatedUrlsRef = useRef<string[]>([])

  useEffect(() => {
    const url = URL.createObjectURL(file)
    setDisplayUrl(url)
    setCrop(undefined)
    setCompletedCrop(undefined)
    return () => {
      URL.revokeObjectURL(url)
      rotatedUrlsRef.current.forEach((u) => URL.revokeObjectURL(u))
      rotatedUrlsRef.current = []
      setDisplayUrl('')
    }
  }, [file])

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget
    const c = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, 1, width, height),
      width,
      height,
    )
    setCrop(c)
  }

  async function handleRotate(dir: 'cw' | 'ccw') {
    const img = imgRef.current
    if (!img || isRotating) return
    setIsRotating(true)
    try {
      const degrees = dir === 'cw' ? 90 : -90
      const blob = await rotateImageBlob(img, degrees)
      const newUrl = URL.createObjectURL(blob)
      rotatedUrlsRef.current.push(newUrl)
      setDisplayUrl(newUrl)
      setCrop(undefined)
      setCompletedCrop(undefined)
    } finally {
      setIsRotating(false)
    }
  }

  async function handleConfirm() {
    if (!imgRef.current || !completedCrop) return
    const blob = await getCroppedBlob(imgRef.current, completedCrop)
    onConfirm(new File([blob], file.name, { type: 'image/jpeg' }))
  }

  const busy = isUploading || isRotating

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="card-solid w-full max-w-lg space-y-4 rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CropIcon className="h-4 w-4 text-accent" />
            <span className="font-heading text-sm font-semibold">
              {busy
                ? 'Subiendo…'
                : `Recortar imagen ${current} de ${total}`}
            </span>
          </div>

          <div className="flex gap-1">
            <button
              onClick={() => handleRotate('ccw')}
              disabled={busy}
              title="Rotar 90° izquierda"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-40"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleRotate('cw')}
              disabled={busy}
              title="Rotar 90° derecha"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-40"
            >
              <RotateCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex max-h-[60vh] justify-center overflow-auto">
          {displayUrl && (
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={1}
              minWidth={50}
              minHeight={50}
              disabled={busy}
            >
              <img
                ref={imgRef}
                src={displayUrl}
                alt="Recortar"
                onLoad={onImageLoad}
                className="max-h-[55vh] max-w-full object-contain"
              />
            </ReactCrop>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            disabled={busy}
            onClick={onCancel}
          >
            Cancelar todo
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            disabled={busy}
            onClick={() => onSkip(file)}
          >
            Omitir recorte
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-accent hover:bg-accent/90"
            disabled={!completedCrop || busy}
            onClick={handleConfirm}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Recortar y subir'}
          </Button>
        </div>
      </div>
    </div>
  )
}

async function rotateImageBlob(image: HTMLImageElement, degrees: number): Promise<Blob> {
  const rad = (degrees * Math.PI) / 180
  const w = image.naturalWidth
  const h = image.naturalHeight
  const canvas = document.createElement('canvas')
  canvas.width = Math.abs(degrees) === 90 ? h : w
  canvas.height = Math.abs(degrees) === 90 ? w : h
  const ctx = canvas.getContext('2d')!
  ctx.translate(canvas.width / 2, canvas.height / 2)
  ctx.rotate(rad)
  ctx.drawImage(image, -w / 2, -h / 2)
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas vacío'))),
      'image/jpeg',
      0.92,
    )
  })
}

async function getCroppedBlob(image: HTMLImageElement, crop: PixelCrop): Promise<Blob> {
  const scaleX = image.naturalWidth / image.width
  const scaleY = image.naturalHeight / image.height
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(crop.width * scaleX)
  canvas.height = Math.round(crop.height * scaleY)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(
    image,
    Math.round(crop.x * scaleX),
    Math.round(crop.y * scaleY),
    Math.round(crop.width * scaleX),
    Math.round(crop.height * scaleY),
    0,
    0,
    canvas.width,
    canvas.height,
  )
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas vacío'))),
      'image/jpeg',
      0.92,
    )
  })
}
