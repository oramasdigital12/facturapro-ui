import React, { createContext, useContext, useState, useEffect } from 'react';
import { Venta } from '../types';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface VentasContextType {
  ventas: Venta[];
  isLoading: boolean;
  agregarVenta: (venta: Omit<Venta, 'id' | 'creada_en' | 'actualizada_en'>) => Promise<void>;
  actualizarVenta: (id: string, venta: Partial<Venta>) => Promise<void>;
  eliminarVenta: (id: string) => Promise<void>;
  recargarVentas: () => Promise<void>;
  exportarVentas: (formato: 'excel' | 'pdf') => Promise<void>;
  obtenerEstadisticas: (filtros: { fechaInicio?: string; fechaFin?: string }) => Promise<{
    totalRecurrente: number;
    totalUnico: number;
    totalComisiones: number;
  }>;
}

const VentasContext = createContext<VentasContextType | undefined>(undefined);

// Exportamos el hook como una constante para hacerlo compatible con Fast Refresh
const useVentas = () => {
  const context = useContext(VentasContext);
  if (context === undefined) {
    throw new Error('useVentas debe usarse dentro de un VentasProvider');
  }
  return context;
};

export { useVentas };

export function VentasProvider({ children }: { children: React.ReactNode }) {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function cargarVentas() {
    try {
      const response = await api.get('/ventas');
      setVentas(response.data);
    } catch (error) {
      console.error('Error al cargar ventas:', error);
      toast.error('Error al cargar las ventas');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    cargarVentas();
  }, []);

  async function agregarVenta(venta: Omit<Venta, 'id' | 'creada_en' | 'actualizada_en'>) {
    try {
      const response = await api.post('/ventas', venta);
      setVentas(prev => [...prev, response.data]);
      toast.success('Venta registrada correctamente');
    } catch (error) {
      console.error('Error al registrar venta:', error);
      toast.error('Error al registrar la venta');
      throw error;
    }
  }

  async function actualizarVenta(id: string, venta: Partial<Venta>) {
    try {
      const response = await api.put(`/ventas/${id}`, venta);
      setVentas(prev => prev.map(v => v.id === id ? response.data : v));
      toast.success('Venta actualizada correctamente');
    } catch (error) {
      console.error('Error al actualizar venta:', error);
      toast.error('Error al actualizar la venta');
      throw error;
    }
  }

  async function eliminarVenta(id: string) {
    try {
      await api.delete(`/ventas/${id}`);
      setVentas(prev => prev.filter(v => v.id !== id));
      toast.success('Venta eliminada correctamente');
    } catch (error) {
      console.error('Error al eliminar venta:', error);
      toast.error('Error al eliminar la venta');
    }
  }

  async function exportarVentas(formato: 'excel' | 'pdf') {
    try {
      const response = await api.get(`/ventas/exportar/${formato}`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], {
        type: formato === 'excel' 
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'application/pdf'
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ventas.${formato === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(`Ventas exportadas a ${formato.toUpperCase()}`);
    } catch (error) {
      console.error('Error al exportar ventas:', error);
      toast.error('Error al exportar las ventas');
    }
  }

  async function obtenerEstadisticas(filtros: { fechaInicio?: string; fechaFin?: string }) {
    try {
      const response = await api.get('/ventas/estadisticas', { params: filtros });
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      toast.error('Error al obtener las estadísticas');
      throw error;
    }
  }

  const value = {
    ventas,
    isLoading,
    agregarVenta,
    actualizarVenta,
    eliminarVenta,
    recargarVentas: cargarVentas,
    exportarVentas,
    obtenerEstadisticas
  };

  return (
    <VentasContext.Provider value={value}>
      {children}
    </VentasContext.Provider>
  );
} 