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