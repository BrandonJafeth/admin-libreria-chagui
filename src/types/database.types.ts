export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          nombre: string
          slug: string
          orden: number
          created_at: string
        }
        Insert: {
          id?: string
          nombre: string
          slug: string
          orden?: number
          created_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          slug?: string
          orden?: number
          created_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          slug: string
          nombre: string
          precio: number
          descripcion: string
          estado: 'disponible' | 'agotado'
          destacado: boolean
          created_at: string
          updated_at: string
          tipo: 'simple' | 'paquete'
          descuento_tipo: 'precio_fijo' | 'porcentaje' | null
          precio_oferta: number | null
          descuento_porcentaje: number | null
          descuento_activo: boolean
          descuento_inicio: string | null
          descuento_fin: string | null
        }
        Insert: {
          id?: string
          slug: string
          nombre: string
          precio: number
          descripcion?: string
          estado?: 'disponible' | 'agotado'
          destacado?: boolean
          created_at?: string
          updated_at?: string
          tipo?: 'simple' | 'paquete'
          descuento_tipo?: 'precio_fijo' | 'porcentaje' | null
          precio_oferta?: number | null
          descuento_porcentaje?: number | null
          descuento_activo?: boolean
          descuento_inicio?: string | null
          descuento_fin?: string | null
        }
        Update: {
          id?: string
          slug?: string
          nombre?: string
          precio?: number
          descripcion?: string
          estado?: 'disponible' | 'agotado'
          destacado?: boolean
          created_at?: string
          updated_at?: string
          tipo?: 'simple' | 'paquete'
          descuento_tipo?: 'precio_fijo' | 'porcentaje' | null
          precio_oferta?: number | null
          descuento_porcentaje?: number | null
          descuento_activo?: boolean
          descuento_inicio?: string | null
          descuento_fin?: string | null
        }
        Relationships: []
      }
      product_categories: {
        Row: { product_id: string; category_id: string }
        Insert: { product_id: string; category_id: string }
        Update: { product_id?: string; category_id?: string }
        Relationships: []
      }
      product_bundle_items: {
        Row: {
          id: string
          paquete_id: string
          producto_id: string
          cantidad: number
          orden: number
          created_at: string
        }
        Insert: {
          id?: string
          paquete_id: string
          producto_id: string
          cantidad?: number
          orden?: number
          created_at?: string
        }
        Update: {
          id?: string
          paquete_id?: string
          producto_id?: string
          cantidad?: number
          orden?: number
          created_at?: string
        }
        Relationships: []
      }
      product_gifts: {
        Row: {
          id: string
          producto_disparador_id: string
          producto_regalo_id: string
          cantidad_regalo: number
          mensaje: string
          activo: boolean
          fecha_inicio: string | null
          fecha_fin: string | null
          created_at: string
        }
        Insert: {
          id?: string
          producto_disparador_id: string
          producto_regalo_id: string
          cantidad_regalo?: number
          mensaje: string
          activo?: boolean
          fecha_inicio?: string | null
          fecha_fin?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          producto_disparador_id?: string
          producto_regalo_id?: string
          cantidad_regalo?: number
          mensaje?: string
          activo?: boolean
          fecha_inicio?: string | null
          fecha_fin?: string | null
          created_at?: string
        }
        Relationships: []
      }
      product_images: {
        Row: {
          id: string
          product_id: string
          url: string
          orden: number
          es_principal: boolean
          alt: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          url: string
          orden?: number
          es_principal?: boolean
          alt?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          url?: string
          orden?: number
          es_principal?: boolean
          alt?: string | null
          created_at?: string
        }
        Relationships: []
      }
      product_colors: {
        Row: {
          id: string
          product_id: string
          nombre: string
          hex: string | null
          orden: number
        }
        Insert: {
          id?: string
          product_id: string
          nombre: string
          hex?: string | null
          orden?: number
        }
        Update: {
          id?: string
          product_id?: string
          nombre?: string
          hex?: string | null
          orden?: number
        }
        Relationships: []
      }
      product_reviews: {
        Row: {
          id: string
          product_id: string
          author_name: string
          rating: number
          comment: string | null
          approved: boolean
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          author_name: string
          rating: number
          comment?: string | null
          approved?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          author_name?: string
          rating?: number
          comment?: string | null
          approved?: boolean
          created_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          customer_name: string
          customer_phone: string
          notes: string | null
          total: number
          status: 'pendiente' | 'confirmado' | 'cancelado'
          created_at: string
        }
        Insert: {
          id?: string
          customer_name: string
          customer_phone: string
          notes?: string | null
          total: number
          status?: 'pendiente' | 'confirmado' | 'cancelado'
          created_at?: string
        }
        Update: {
          id?: string
          customer_name?: string
          customer_phone?: string
          notes?: string | null
          total?: number
          status?: 'pendiente' | 'confirmado' | 'cancelado'
          created_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          product_nombre: string
          color: string | null
          precio_unitario: number
          cantidad: number
          subtotal: number
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: string | null
          product_nombre: string
          color?: string | null
          precio_unitario: number
          cantidad: number
          subtotal: number
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string | null
          product_nombre?: string
          color?: string | null
          precio_unitario?: number
          cantidad?: number
          subtotal?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          email: string
          role: 'admin' | 'employee'
          created_at: string
        }
        Insert: {
          id: string
          email: string
          role?: 'admin' | 'employee'
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'admin' | 'employee'
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type Insertable<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
export type Updatable<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
