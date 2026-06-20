function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255, gn = g / 255, bn = b / 255
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  const h = max === rn ? (gn - bn) / d + (gn < bn ? 6 : 0)
    : max === gn ? (bn - rn) / d + 2
    : (rn - gn) / d + 4
  return [h / 6, s, l]
}

export function extractDominantColor(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 50
      canvas.height = 50
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, 50, 50)
      URL.revokeObjectURL(url)
      const { data } = ctx.getImageData(0, 0, 50, 50)
      let bestR = 136, bestG = 136, bestB = 136, bestS = -1
      for (let i = 0; i < data.length; i += 4) {
        const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]]
        if (a < 128) continue
        const [, s, l] = rgbToHsl(r, g, b)
        if (l < 0.08 || l > 0.95) continue
        if (s > bestS) { bestS = s; bestR = r; bestG = g; bestB = b }
      }
      const h = (n: number) => n.toString(16).padStart(2, '0')
      resolve(`#${h(bestR)}${h(bestG)}${h(bestB)}`)
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Error al leer imagen')) }
    img.src = url
  })
}
