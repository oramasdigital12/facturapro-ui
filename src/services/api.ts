import axios from 'axios';
import { NegocioConfig, CategoriaNegocio, ServicioNegocio } from '../types';

// Función para validar UUID
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isValid = uuidRegex.test(uuid);
  
  if (!isValid) {
    console.warn('❌ UUID inválido detectado:', uuid);
  }
  
  return isValid;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: false
});

// Interceptor para manejar errores
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject({
      ...error,
      message: error.response?.data?.message || 'Error en la operación'
    });
  }
);

// Interceptor para añadir el token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// --- Negocio Config ---
export const getNegocioConfig = () => api.get<NegocioConfig>('/api/negocio-config');
export const updateNegocioConfig = (data: Partial<NegocioConfig>) => api.post('/api/negocio-config', data);
export const uploadNegocioLogo = (file: File) => {
  const formData = new FormData();
  formData.append('logo', file);
  return api.post('/api/negocio-config/logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// --- Categorías ---
export const getCategoriasNegocio = () => api.get<CategoriaNegocio[]>('/api/categorias-negocio');
export const createCategoriaNegocio = (data: { nombre: string; orden?: number }) => api.post('/api/categorias-negocio', data);
export const updateCategoriaNegocio = (id: string, data: { nombre: string; orden?: number }) => api.put(`/api/categorias-negocio/${id}`, data);
export const deleteCategoriaNegocio = (id: string) => api.delete(`/api/categorias-negocio/${id}`);

// --- Servicios ---
export const getServiciosNegocio = (categoria_id?: string) => api.get<ServicioNegocio[]>(`/api/servicios-negocio${categoria_id ? `?categoria_id=${categoria_id}` : ''}`);
export const createServicioNegocio = (data: { nombre: string; precio: number; categoria_id: string }) => api.post('/api/servicios-negocio', data);
export const updateServicioNegocio = (id: string, data: { nombre: string; precio: number; categoria_id: string }) => api.put(`/api/servicios-negocio/${id}`, data);
export const deleteServicioNegocio = (id: string) => api.delete(`/api/servicios-negocio/${id}`);

// --- Facturas ---
export const getFacturas = (params?: any) => api.get('/api/facturas', { params });
export const getFacturaById = (id: string) => api.get(`/api/facturas/${id}`);
export const createFactura = (data: any) => api.post('/api/facturas', data);
export const updateFactura = (id: string, data: any) => api.put(`/api/facturas/${id}`, data);
export const deleteFactura = (id: string) => api.delete(`/api/facturas/${id}`);
export const softDeleteFactura = (id: string) => {
  if (!isValidUUID(id)) {
    return Promise.reject(new Error('ID de factura inválido'));
  }
  return api.post(`/api/facturas/${id}/soft-delete`);
};

export const restoreFactura = (id: string) => {
  if (!isValidUUID(id)) {
    return Promise.reject(new Error('ID de factura inválido'));
  }
  return api.post(`/api/facturas/${id}/restore`);
};

export const hardDeleteFactura = (id: string) => {
  if (!isValidUUID(id)) {
    return Promise.reject(new Error('ID de factura inválido'));
  }
  return api.delete(`/api/facturas/${id}/hard-delete`);
};

export const getFacturasEliminadas = (params?: any) => api.get('/api/facturas/eliminadas', { params });
export const getUltimaFactura = () => api.get('/api/facturas?limit=1&order=numero_factura.desc');
export const regenerateFacturaPDF = (id: string) => api.post(`/api/facturas/${id}/regenerate-pdf`);

// --- Clientes ---
export const getClientes = () => api.get('/api/clientes');

// --- Métodos de Pago ---
export const getMetodosPago = () => api.get('/api/metodos-pago');
export const getMetodoPagoById = (id: string) => api.get(`/api/metodos-pago/${id}`);
export const createMetodoPago = (data: any) => api.post('/api/metodos-pago', data);
export const updateMetodoPago = (id: string, data: any) => api.put(`/api/metodos-pago/${id}`, data);
export const deleteMetodoPago = (id: string) => api.delete(`/api/metodos-pago/${id}`);
export const updateOrdenMetodosPago = (ids: string[]) => api.post('/api/metodos-pago/orden', { ids });

export default api; 