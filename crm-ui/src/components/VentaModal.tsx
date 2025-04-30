import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Venta, Cliente } from '../types';
import { useVentas } from '../contexts/VentasContext';
import { useClientes } from '../contexts/ClientesContext';
import toast from 'react-hot-toast';

interface VentaModalProps {
  isOpen: boolean;
  onClose: () => void;
  venta?: Partial<Venta>;
  onVentaGuardada?: () => void;
}

export default function VentaModal({ isOpen, onClose, venta, onVentaGuardada }: VentaModalProps) {
  const { agregarVenta, actualizarVenta } = useVentas();
  const { clientes } = useClientes();
  const [formData, setFormData] = useState<Omit<Venta, 'id' | 'creada_en' | 'actualizada_en'>>({
    cliente_id: '',
    tipo: 'unica',
    monto: 0,
    comision: 0,
    fecha_pago: new Date().toISOString().split('T')[0],
    fecha_siguiente_pago: undefined,
    estado: 'pendiente'
  });

  useEffect(() => {
    if (venta) {
      setFormData({
        cliente_id: venta.cliente_id || '',
        tipo: venta.tipo || 'unica',
        monto: venta.monto || 0,
        comision: venta.comision || 0,
        fecha_pago: venta.fecha_pago || new Date().toISOString().split('T')[0],
        fecha_siguiente_pago: venta.fecha_siguiente_pago,
        estado: venta.estado || 'pendiente'
      });
    } else {
      setFormData({
        cliente_id: '',
        tipo: 'unica',
        monto: 0,
        comision: 0,
        fecha_pago: new Date().toISOString().split('T')[0],
        fecha_siguiente_pago: undefined,
        estado: 'pendiente'
      });
    }
  }, [venta]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (venta?.id) {
        await actualizarVenta(venta.id, formData);
      } else {
        await agregarVenta(formData);
      }
      if (onVentaGuardada) {
        onVentaGuardada();
      }
      onClose();
      toast.success(venta?.id ? 'Venta actualizada correctamente' : 'Venta registrada correctamente');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar la venta');
    }
  }

  const clienteSeleccionado = clientes.find(c => c.id === formData.cliente_id);

  const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <span className="sr-only">Cerrar</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      {venta?.id ? 'Editar venta' : 'Nueva venta'}
                    </Dialog.Title>
                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                      <div>
                        <label htmlFor="cliente" className="block text-sm font-medium text-gray-700">
                          Cliente
                        </label>
                        <select
                          id="cliente"
                          required
                          value={formData.cliente_id}
                          onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        >
                          <option value="">Seleccionar cliente</option>
                          {clientes.map((cliente) => (
                            <option key={cliente.id} value={cliente.id}>
                              {cliente.nombre}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="tipo" className="block text-sm font-medium text-gray-700">
                          Tipo de venta
                        </label>
                        <select
                          id="tipo"
                          name="tipo"
                          value={formData.tipo}
                          onChange={(e) => setFormData({ ...formData, tipo: e.target.value as 'unica' | 'recurrente' })}
                          className="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        >
                          <option value="unica">Única</option>
                          <option value="recurrente">Recurrente</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="monto" className="block text-sm font-medium text-gray-700">
                          Monto
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <span className="text-gray-500 sm:text-sm">$</span>
                          </div>
                          <input
                            type="number"
                            id="monto"
                            required
                            min="0"
                            step="0.01"
                            value={formData.monto}
                            onChange={(e) => setFormData({ ...formData, monto: parseFloat(e.target.value) })}
                            className="block w-full rounded-md border-gray-300 pl-7 pr-12 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="comision" className="block text-sm font-medium text-gray-700">
                          Comisión
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <span className="text-gray-500 sm:text-sm">$</span>
                          </div>
                          <input
                            type="number"
                            id="comision"
                            required
                            min="0"
                            step="0.01"
                            value={formData.comision}
                            onChange={(e) => setFormData({ ...formData, comision: parseFloat(e.target.value) })}
                            className="block w-full rounded-md border-gray-300 pl-7 pr-12 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="fecha_pago" className="block text-sm font-medium text-gray-700">
                          Fecha de pago
                        </label>
                        <input
                          type="date"
                          id="fecha_pago"
                          required
                          value={formData.fecha_pago}
                          onChange={(e) => setFormData({ ...formData, fecha_pago: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>

                      {formData.tipo === 'recurrente' && (
                        <div>
                          <label htmlFor="fecha_siguiente_pago" className="block text-sm font-medium text-gray-700">
                            Fecha del siguiente pago
                          </label>
                          <input
                            type="date"
                            id="fecha_siguiente_pago"
                            value={formData.fecha_siguiente_pago}
                            onChange={(e) => setFormData({ ...formData, fecha_siguiente_pago: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                        </div>
                      )}

                      <div>
                        <label htmlFor="estado" className="block text-sm font-medium text-gray-700">
                          Estado
                        </label>
                        <select
                          id="estado"
                          name="estado"
                          value={formData.estado}
                          onChange={(e) => setFormData({ ...formData, estado: e.target.value as 'pendiente' | 'pagada' })}
                          className="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="pagada">Pagada</option>
                        </select>
                      </div>

                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto"
                        >
                          {venta?.id ? 'Guardar cambios' : 'Registrar venta'}
                        </button>
                        <button
                          type="button"
                          className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                          onClick={onClose}
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
} 