import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  getServiciosNegocio,
  createServicioNegocio,
  updateServicioNegocio,
  deleteServicioNegocio,
} from '../services/api';
import { CategoriaNegocio, ServicioNegocio } from '../types';
import Modal from './Modal';
import Swal from 'sweetalert2';

interface Props {
  categoria: CategoriaNegocio;
}

export default function ServiciosContent({ categoria }: Props) {
  console.log('ServiciosContent renderizado con categoría:', categoria);
  
  const [servicios, setServicios] = useState<ServicioNegocio[]>([]);
  const [loading, setLoading] = useState(false);
  const [editServicio, setEditServicio] = useState<ServicioNegocio | null>(null);
  const [formServicio, setFormServicio] = useState({ nombre: '', precio: '' });
  const [showFormModal, setShowFormModal] = useState(false);

  // Cargar servicios cuando se monta el componente
  useEffect(() => {
    console.log('ServiciosContent useEffect ejecutado');
    cargarServicios();
  }, [categoria]);

  const cargarServicios = async () => {
    setLoading(true);
    try {
      const res = await getServiciosNegocio(categoria.id);
      setServicios(res.data);
    } catch (error) {
      console.error('Error cargando servicios:', error);
      setServicios([]);
      toast.error('Error al cargar los servicios');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormServicio({ ...formServicio, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formServicio.nombre.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    
    if (!formServicio.precio || isNaN(Number(formServicio.precio)) || Number(formServicio.precio) <= 0) {
      toast.error('Precio inválido');
      return;
    }

    try {
      if (editServicio) {
        await updateServicioNegocio(editServicio.id, {
          nombre: formServicio.nombre.trim(),
          precio: Number(formServicio.precio),
          categoria_id: categoria.id,
        });
        toast.success('Servicio actualizado correctamente');
      } else {
        await createServicioNegocio({
          nombre: formServicio.nombre.trim(),
          precio: Number(formServicio.precio),
          categoria_id: categoria.id,
        });
        toast.success('Servicio creado correctamente');
      }
      
      // Limpiar formulario y cerrar modal
      setFormServicio({ nombre: '', precio: '' });
      setEditServicio(null);
      setShowFormModal(false);
      
      // Recargar servicios
      await cargarServicios();
    } catch (error) {
      console.error('Error guardando servicio:', error);
      toast.error('Error al guardar el servicio');
    }
  };

  const handleEdit = (servicio: ServicioNegocio) => {
    console.log('handleEdit ejecutado para servicio:', servicio);
    setEditServicio(servicio);
    setFormServicio({ 
      nombre: servicio.nombre, 
      precio: servicio.precio.toString() 
    });
    setShowFormModal(true);
  };

  const handleDelete = async (servicio: ServicioNegocio) => {
    console.log('handleDelete ejecutado para servicio:', servicio);
    const result = await Swal.fire({
      title: '¿Eliminar servicio?',
      text: `¿Estás seguro de que quieres eliminar "${servicio.nombre}"? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (!result.isConfirmed) return;

    try {
      await deleteServicioNegocio(servicio.id);
      toast.success('Servicio eliminado correctamente');
      await cargarServicios();
    } catch (error) {
      console.error('Error eliminando servicio:', error);
      toast.error('Error al eliminar el servicio');
    }
  };

  const handleNuevoServicio = () => {
    console.log('handleNuevoServicio ejecutado');
    setEditServicio(null);
    setFormServicio({ nombre: '', precio: '' });
    setShowFormModal(true);
  };

  const handleCloseForm = () => {
    setShowFormModal(false);
    setEditServicio(null);
    setFormServicio({ nombre: '', precio: '' });
  };

  return (
    <>
      {/* Header con botón de nuevo servicio */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Lista de Servicios
          </h3>
          <p className="text-sm text-gray-500">
            {servicios.length} servicio{servicios.length !== 1 ? 's' : ''} en esta categoría
          </p>
        </div>
        <button
          onClick={handleNuevoServicio}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <PlusIcon className="h-4 w-4" />
          Nuevo Servicio
        </button>
      </div>

      {/* Tabla de servicios */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Cargando servicios...</span>
          </div>
        ) : servicios.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <PlusIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay servicios aún
            </h3>
            <p className="text-gray-500 mb-4">
              Comienza agregando el primer servicio a esta categoría
            </p>
            <button
              onClick={handleNuevoServicio}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              Agregar Primer Servicio
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Servicio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {servicios.map((servicio) => (
                  <tr key={servicio.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {servicio.nombre}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-semibold">
                        ${servicio.precio.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(servicio)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar servicio"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(servicio)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar servicio"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para crear/editar servicio */}
      {showFormModal && (
        <Modal open={showFormModal} onClose={handleCloseForm}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-auto">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900">
                {editServicio ? 'Editar Servicio' : 'Nuevo Servicio'}
              </h3>
              <p className="text-sm text-gray-500">
                {editServicio ? 'Modifica los datos del servicio' : 'Agrega un nuevo servicio a la categoría'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Servicio
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formServicio.nombre}
                  onChange={handleFormChange}
                  placeholder="Ej: Diseño de logo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    name="precio"
                    value={formServicio.precio}
                    onChange={handleFormChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {editServicio ? 'Actualizar' : 'Crear'} Servicio
                </button>
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </>
  );
}
