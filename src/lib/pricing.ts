export interface ProductoConDescuento {
  precio: number
  descuento_tipo: 'precio_fijo' | 'porcentaje' | null
  precio_oferta: number | null
  descuento_porcentaje: number | null
  descuento_activo: boolean
  descuento_inicio: string | null
  descuento_fin: string | null
}

// Espejo de la función SQL precio_final() — misma lógica, mismo orden de checks.
export function precioFinal(p: ProductoConDescuento): number {
  if (!p.descuento_tipo || !p.descuento_activo) return p.precio

  const now = Date.now()
  if (p.descuento_inicio && now < new Date(p.descuento_inicio).getTime()) return p.precio
  if (p.descuento_fin && now > new Date(p.descuento_fin).getTime()) return p.precio

  if (p.descuento_tipo === 'precio_fijo') return p.precio_oferta ?? p.precio
  if (p.descuento_tipo === 'porcentaje') {
    return Math.round(p.precio * (1 - (p.descuento_porcentaje ?? 0) / 100))
  }
  return p.precio
}

export function enOferta(p: ProductoConDescuento): boolean {
  return precioFinal(p) < p.precio
}
