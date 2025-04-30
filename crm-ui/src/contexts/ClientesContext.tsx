import React, { createContext, useContext, useState, useEffect } from 'react';
import { Cliente } from '../types';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface ClientesContextType {
  clientes: Cliente[];
  isLoading: boolean;
  agregarCliente: (cliente: Omit<Cliente, 'id' | 'notas' | 'ventas' | 'created_at' | 'updated_at'>) => Promise<void>;
  actualizarCliente: (id: string, cliente: Partial<Cliente>) => Promise<void>;
  eliminarCliente: (id: string) => Promise<void>;
  recargarClientes: () => Promise<void>;
}

const ClientesContext = createContext<ClientesContextType | undefined>(undefined);

// Exportamos el hook como una constante para hacerlo compatible con Fast Refresh
const useClientes = () => {
  const context = useContext(ClientesContext);
  if (context === undefined) {
    throw new Error('useClientes debe usarse dentro de un ClientesProvider');
  }
  return context;
};

export { useClientes };

export function ClientesProvider({ children }: { children: React.ReactNode }) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function cargarClientes() {
    try {
      setIsLoading(true);
      const response = await api.get('/clientes');
      setClientes(response.data);
    } catch (error) {
      toast.error('Error al cargar los clientes');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    cargarClientes();
  }, []);

  async function agregarCliente(cliente: Omit<Cliente, 'id' | 'notas' | 'ventas' | 'created_at' | 'updated_at'>) {
    try {
      setIsLoading(true);
      const response = await api.post('/clientes', cliente);
      const nuevoCliente = response.data;
      setClientes([...clientes, nuevoCliente]);
      toast.success('Cliente agregado exitosamente');
    } catch (error) {
      toast.error('Error al agregar el cliente');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function actualizarCliente(id: string, cliente: Partial<Cliente>) {
    try {
      setIsLoading(true);
      const response = await api.put(`/clientes/${id}`, cliente);
      const clienteActualizado = response.data;
      setClientes(clientes.map(c => c.id === id ? clienteActualizado : c));
      toast.success('Cliente actualizado exitosamente');
    } catch (error) {
      toast.error('Error al actualizar el cliente');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function eliminarCliente(id: string) {
    try {
      setIsLoading(true);
      await api.delete(`/clientes/${id}`);
      setClientes(clientes.filter(c => c.id !== id));
      toast.success('Cliente eliminado exitosamente');
    } catch (error) {
      toast.error('Error al eliminar el cliente');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const value = {
    clientes,
    isLoading,
    agregarCliente,
    actualizarCliente,
    eliminarCliente,
    recargarClientes: cargarClientes
  };

  return (
    <ClientesContext.Provider value={value}>
      {children}
    </ClientesContext.Provider>
  );
} 