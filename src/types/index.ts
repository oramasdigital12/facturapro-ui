export interface Cliente {
  id: string;
  nombre: string;
}

export interface Venta {
  id: string;
  cliente_id: string;
  monto: string;
  tipo: 'venta' | 'mensual';
  fecha: string;
  created_at: string;
}

// Configuración del negocio
export interface NegocioConfig {
  nombre_negocio: string;
  tipo_negocio: string;
  telefono: string;
  email: string;
  direccion: string;
  logo_url?: string;
  color_personalizado?: string;
  nota_factura?: string;
  terminos_condiciones?: string;
}

// Categoría de negocio
export interface CategoriaNegocio {
  id: string;
  user_id: string;
  nombre: string;
  orden?: number;
  created_at: string;
}

// Servicio de negocio
export interface ServicioNegocio {
  id: string;
  categoria_id: string;
  user_id: string;
  nombre: string;
  precio: number;
  created_at: string;
} 