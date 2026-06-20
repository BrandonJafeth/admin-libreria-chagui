const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string

export async function uploadToCloudinary(file: File): Promise<{ url: string; publicId: string }> {
  const form = new FormData()
  form.append('file', file)
  form.append('upload_preset', UPLOAD_PRESET)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: form },
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: { message?: string } })?.error?.message ?? 'Error subiendo imagen')
  }

  const data = await res.json() as { secure_url: string; public_id: string }
  return { url: data.secure_url, publicId: data.public_id }
}

export function extractPublicId(cloudinaryUrl: string): string {
  // https://res.cloudinary.com/{cloud}/image/upload/v{version}/{public_id}.{ext}
  const match = cloudinaryUrl.match(/\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/)
  return match?.[1] ?? ''
}
