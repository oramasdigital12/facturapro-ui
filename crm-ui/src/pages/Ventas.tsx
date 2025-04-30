import { useState, useEffect } from 'react';
import { PlusIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Venta } from '../types';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { exportVentasToExcel } from '../utils/excel';
import { useClientes } from '../contexts/ClientesContext';
import VentaModal from '../components/VentaModal';

export default function Ventas() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { clientes } = useClientes();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [ventaEditando, setVentaEditando] = useState<Partial<Venta> | undefined>(undefined);

  useEffect(() => {
    cargarVentas();
  }, []);

  async function cargarVentas() {
    try {
      setIsLoading(true);
      const response = await api.get('/ventas');
      setVentas(response.data);
    } catch (error) {
      toast.error('Error al cargar las ventas');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleExportarExcel() {
    try {
      exportVentasToExcel(ventas, clientes);
      toast.success('Datos exportados exitosamente');
    } catch (error) {
      toast.error('Error al exportar los datos');
      console.error('Error:', error);
    }
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Ventas</h1>
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
              setVentaEditando(undefined);
              setModalAbierto(true);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-1" />
            Nueva Venta
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
          <p className="mt-2 text-gray-500">Cargando ventas...</p>
        </div>
      ) : ventas.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No hay ventas registradas</p>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ventas.map((venta) => {
                const cliente = clientes.find(c => c.id === venta.cliente_id);
                return (
                  <tr key={venta.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cliente?.nombre || 'Cliente no encontrado'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${venta.monto}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(venta.fecha_pago).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {venta.tipo === 'recurrente' ? 'Recurrente' : 'Única'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        venta.estado === 'pagada'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {venta.estado === 'pagada' ? 'Pagada' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => {
                          setVentaEditando(venta);
                          setModalAbierto(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <VentaModal
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        venta={ventaEditando}
        onVentaGuardada={cargarVentas}
      />
    </div>
  );
} 