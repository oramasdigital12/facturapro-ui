import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Cliente } from '../types';
import { useClientes } from '../contexts/ClientesContext';
import NotasCliente from './NotasCliente';
import toast from 'react-hot-toast';

interface ClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  cliente?: Partial<Cliente>;
}

export default function ClienteModal({ isOpen, onClose, cliente }: ClienteModalProps) {
  const { agregarCliente, actualizarCliente } = useClientes();
  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    email: '',
    direccion: '',
    fecha_nacimiento: '',
    fecha_inicio: '',
    fecha_vencimiento: '',
    categoria: 'activo' as 'activo' | 'pendiente' | 'por_vencer'
  });

  useEffect(() => {
    if (cliente) {
      setForm({
        nombre: cliente.nombre || '',
        telefono: cliente.telefono || '',
        email: cliente.email || '',
        direccion: cliente.direccion || '',
        fecha_nacimiento: cliente.fecha_nacimiento || '',
        fecha_inicio: cliente.fecha_inicio || '',
        fecha_vencimiento: cliente.fecha_vencimiento || '',
        categoria: cliente.categoria || 'activo'
      });
    }
  }, [cliente]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (cliente?.id) {
        await actualizarCliente(cliente.id, form);
      } else {
        await agregarCliente(form);
      }
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar el cliente');
    }
  }

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
                      {cliente?.id ? 'Editar cliente' : 'Nuevo cliente'}
                    </Dialog.Title>
                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
                            Nombre completo
                          </label>
                          <input
                            type="text"
                            id="nombre"
                            required
                            value={form.nombre}
                            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">
                            Teléfono
                          </label>
                          <input
                            type="tel"
                            id="telefono"
                            required
                            value={form.telefono}
                            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email
                          </label>
                          <input
                            type="email"
                            id="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor="direccion" className="block text-sm font-medium text-gray-700">
                            Dirección
                          </label>
                          <input
                            type="text"
                            id="direccion"
                            value={form.direccion}
                            onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor="fecha_nacimiento" className="block text-sm font-medium text-gray-700">
                            Fecha de nacimiento
                          </label>
                          <input
                            type="date"
                            id="fecha_nacimiento"
                            value={form.fecha_nacimiento}
                            onChange={(e) => setForm({ ...form, fecha_nacimiento: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor="fecha_inicio" className="block text-sm font-medium text-gray-700">
                            Fecha de inicio
                          </label>
                          <input
                            type="date"
                            id="fecha_inicio"
                            value={form.fecha_inicio}
                            onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor="fecha_vencimiento" className="block text-sm font-medium text-gray-700">
                            Fecha de vencimiento
                          </label>
                          <input
                            type="date"
                            id="fecha_vencimiento"
                            value={form.fecha_vencimiento}
                            onChange={(e) => setForm({ ...form, fecha_vencimiento: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor="categoria" className="block text-sm font-medium text-gray-700">
                            Categoría
                          </label>
                          <select
                            id="categoria"
                            value={form.categoria}
                            onChange={(e) => setForm({ ...form, categoria: e.target.value as 'activo' | 'pendiente' | 'por_vencer' })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          >
                            <option value="activo">Activo</option>
                            <option value="pendiente">Pendiente</option>
                            <option value="por_vencer">Por vencer</option>
                          </select>
                        </div>
                      </div>

                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto"
                        >
                          {cliente?.id ? 'Guardar cambios' : 'Crear cliente'}
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