export interface User {
  id: string;
  email: string;
  nombre: string;
  negocio: string;
  tipo_negocio: string;
  direccion: string;
  telefono: string;
  google_calendar_connected: boolean;
  whatsapp_templates: WhatsappTemplate[];
  trial_ends_at: string | null;
  subscription_status: 'trial' | 'active' | 'cancelled' | 'expired';
}

export interface Cliente {
  id: string;
  nombre: string;
  telefono: string;
  email?: string;
  direccion?: string;
  fecha_nacimiento?: string;
  fecha_inicio?: string;
  fecha_vencimiento?: string;
  categoria: 'activo' | 'pendiente' | 'por_vencer';
  notas: Nota[];
  ventas: Venta[];
  created_at: string;
  updated_at: string;
}

export interface Nota {
  id: string;
  cliente_id: string;
  titulo: string;
  contenido: string;
  archivos: Archivo[];
  created_at: string;
  updated_at: string;
}

export interface Archivo {
  id: string;
  nota_id: string;
  nombre: string;
  url: string;
  tipo: string;
  tamano: number;
  created_at: string;
}

export interface Venta {
  id: string;
  cliente_id: string;
  tipo: 'unica' | 'recurrente';
  monto: number;
  comision: number;
  fecha_pago: string;
  fecha_siguiente_pago?: string;
  estado: 'pendiente' | 'pagada';
  creada_en: string;
  actualizada_en: string;
}

export interface WhatsappTemplate {
  id: string;
  nombre: string;
  mensaje: string;
  categoria: 'general' | 'vencimiento' | 'cumpleaños' | 'recordatorio';
  created_at?: string;
  updated_at?: string;
}

export interface Mensaje {
  id: string;
  contenido: string;
  created_at: string;
  updated_at: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  stripe_price_id: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  status: 'trialing' | 'active' | 'canceled' | 'incomplete' | 'past_due';
  plan: Plan;
  current_period_end: string;
  cancel_at_period_end: boolean;
  trial_end: string | null;
  stripe_customer_id: string;
  stripe_subscription_id: string;
} 