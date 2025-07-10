import axios from 'axios';
import { NegocioConfig, CategoriaNegocio, ServicioNegocio } from '../types';

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
export const getUltimaFactura = () => api.get('/api/facturas?limit=1&order=numero_factura.desc');

// --- Clientes ---
export const getClientes = () => api.get('/api/clientes');

export default api; 