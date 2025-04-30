import { useState, useEffect } from 'react';
import { PlusIcon, MagnifyingGlassIcon, ChatBubbleLeftIcon, PencilIcon, TrashIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Cliente } from '../types';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useClientes } from '../contexts/ClientesContext';
import ClienteModal from '../components/ClienteModal';
import { exportClientesToExcel } from '../utils/excel';

export default function Clientes() {
  const { clientes, isLoading, agregarCliente, actualizarCliente, eliminarCliente, recargarClientes } = useClientes();
  const [busqueda, setBusqueda] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<Partial<Cliente>>({});

  useEffect(() => {
    recargarClientes();
  }, [recargarClientes]);

  function abrirWhatsApp(telefono: string) {
    window.open(`https://wa.me/${telefono}`, '_blank');
  }

  const clientesFiltrados = clientes.filter((cliente: Cliente) =>
    cliente.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    cliente.telefono.includes(busqueda)
  );

  function handleExportarExcel() {
    try {
      exportClientesToExcel(clientes);
      toast.success('Datos exportados exitosamente');
    } catch (error) {
      toast.error('Error al exportar los datos');
      console.error('Error:', error);
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Clientes</h1>
        <div className="flex gap-2">
          <button
            onClick={handleExportarExcel}
            className="px-4 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 flex items-center"
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-1" />
            Exportar
          </button>
          <button
            onClick={() => {
              setClienteEditando({});
              setModalAbierto(true);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-1" />
            Nuevo Cliente
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar clientes..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-2">
            {clientesFiltrados.map((cliente: Cliente) => (
              <div key={cliente.id} className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">{cliente.nombre}</h3>
                    <p className="text-gray-600">{cliente.telefono}</p>
                    {cliente.email && (
                      <p className="text-gray-500 text-sm">{cliente.email}</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => abrirWhatsApp(cliente.telefono)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                    >
                      <ChatBubbleLeftIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => {
                        setClienteEditando(cliente);
                        setModalAbierto(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => eliminarCliente(cliente.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ClienteModal
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        cliente={clienteEditando}
      />
    </div>
  );
} 