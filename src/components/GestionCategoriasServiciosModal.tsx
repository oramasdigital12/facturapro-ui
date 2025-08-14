import { Dialog } from '@headlessui/react';
import { XMarkIcon, PencilIcon, TrashIcon, PlusIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  getCategoriasNegocio,
  createCategoriaNegocio,
  updateCategoriaNegocio,
  deleteCategoriaNegocio,
  getServiciosNegocio,
  createServicioNegocio,
  updateServicioNegocio,
  deleteServicioNegocio,
} from '../services/api';
import { CategoriaNegocio, ServicioNegocio } from '../types';
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DraggableProvided } from 'react-beautiful-dnd';
import Modal from './Modal';
import Swal from 'sweetalert2';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function GestionCategoriasServiciosModal({ open, onClose }: Props) {
  const [categorias, setCategorias] = useState<CategoriaNegocio[]>([]);
  const [loadingCategorias, setLoadingCategorias] = useState(false);
  const [editCategoria, setEditCategoria] = useState<CategoriaNegocio | null>(null);
  const [formCategoria, setFormCategoria] = useState({ nombre: '', orden: '' });
  const [showCategoriaModal, setShowCategoriaModal] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<CategoriaNegocio | null>(null);

  // Estados para servicios
  const [servicios, setServicios] = useState<ServicioNegocio[]>([]);
  const [loadingServicios, setLoadingServicios] = useState(false);
  const [editServicio, setEditServicio] = useState<ServicioNegocio | null>(null);
  const [formServicio, setFormServicio] = useState({ nombre: '', precio: '' });
  const [showServicioModal, setShowServicioModal] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => setReady(true), 30);
      return () => clearTimeout(timer);
    } else {
      setReady(false);
    }
  }, [open]);

  // Cargar categorías al abrir
  useEffect(() => {
    if (open) cargarCategorias();
    // eslint-disable-next-line
  }, [open]);

  const cargarCategorias = async () => {
    setLoadingCategorias(true);
    try {
      const res = await getCategoriasNegocio();
      setCategorias(res.data);
    } catch {
      setCategorias([]);
    } finally {
      setLoadingCategorias(false);
    }
  };

  // --- Categoría ---
  const handleCategoriaForm = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormCategoria({ ...formCategoria, [e.target.name]: e.target.value });
  };
  
  const handleSubmitCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCategoria.nombre.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    try {
      if (editCategoria) {
        await updateCategoriaNegocio(editCategoria.id, {
          nombre: formCategoria.nombre,
          orden: formCategoria.orden ? Number(formCategoria.orden) : undefined,
        });
        toast.success('Categoría actualizada');
      } else {
        await createCategoriaNegocio({
          nombre: formCategoria.nombre,
          orden: formCategoria.orden ? Number(formCategoria.orden) : undefined,
        });
        toast.success('Categoría creada');
      }
      setFormCategoria({ nombre: '', orden: '' });
      setEditCategoria(null);
      setShowCategoriaModal(false);
      cargarCategorias();
    } catch {
      toast.error('Error al guardar la categoría');
    }
  };
  
  const handleEditCategoria = (cat: CategoriaNegocio) => {
    setEditCategoria(cat);
    setFormCategoria({ nombre: cat.nombre, orden: cat.orden?.toString() || '' });
    setShowCategoriaModal(true);
  };
  
  const handleDeleteCategoria = async (cat: CategoriaNegocio) => {
    const result = await Swal.fire({
      title: '¿Eliminar categoría?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (!result.isConfirmed) return;
    try {
      await deleteCategoriaNegocio(cat.id);
      toast.success('Categoría eliminada');
      cargarCategorias();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  // Drag & Drop para categorías
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const reordered = Array.from(categorias);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setCategorias(reordered);
    // Actualizar el orden en el backend
    try {
      await Promise.all(
        reordered.map((cat, idx) =>
          updateCategoriaNegocio(cat.id, { nombre: cat.nombre, orden: idx + 1 })
        )
      );
      cargarCategorias();
    } catch {
      toast.error('Error al actualizar el orden');
    }
  };

  // Manejar selección de categoría para servicios
  const handleSeleccionarCategoria = (categoria: CategoriaNegocio) => {
    if (categoriaSeleccionada?.id === categoria.id) {
      setCategoriaSeleccionada(null);
      setServicios([]);
    } else {
      setCategoriaSeleccionada(categoria);
      cargarServicios(categoria.id);
    }
  };

  // --- Funciones para servicios ---
  const cargarServicios = async (categoriaId: string) => {
    setLoadingServicios(true);
    try {
      const res = await getServiciosNegocio(categoriaId);
      setServicios(res.data);
    } catch (error) {
      console.error('Error cargando servicios:', error);
      setServicios([]);
      toast.error('Error al cargar los servicios');
    } finally {
      setLoadingServicios(false);
    }
  };

  const handleServicioForm = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormServicio({ ...formServicio, [e.target.name]: e.target.value });
  };

  const handleSubmitServicio = async (e: React.FormEvent) => {
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
          categoria_id: categoriaSeleccionada!.id,
        });
        toast.success('Servicio actualizado correctamente');
      } else {
        await createServicioNegocio({
          nombre: formServicio.nombre.trim(),
          precio: Number(formServicio.precio),
          categoria_id: categoriaSeleccionada!.id,
        });
        toast.success('Servicio creado correctamente');
      }
      
      // Limpiar formulario y cerrar modal
      setFormServicio({ nombre: '', precio: '' });
      setEditServicio(null);
      setShowServicioModal(false);
      
      // Recargar servicios
      await cargarServicios(categoriaSeleccionada!.id);
    } catch (error) {
      console.error('Error guardando servicio:', error);
      toast.error('Error al guardar el servicio');
    }
  };

  const handleEditServicio = (servicio: ServicioNegocio) => {
    setEditServicio(servicio);
    setFormServicio({ 
      nombre: servicio.nombre, 
      precio: servicio.precio.toString() 
    });
    setShowServicioModal(true);
  };

  const handleDeleteServicio = async (servicio: ServicioNegocio) => {
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
      await cargarServicios(categoriaSeleccionada!.id);
    } catch (error) {
      console.error('Error eliminando servicio:', error);
      toast.error('Error al eliminar el servicio');
    }
  };

  const handleNuevoServicio = () => {
    setEditServicio(null);
    setFormServicio({ nombre: '', precio: '' });
    setShowServicioModal(true);
  };

  if (!open) return null;
  
  return (
    <>
      <Dialog open={open} onClose={onClose} className="relative z-[100]">
        <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4">
          <Dialog.Panel className="mx-auto max-w-4xl w-full rounded-2xl bg-white p-0 shadow-lg relative flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 pt-6 pb-2 border-b">
              <h2 className="text-xl font-bold text-gray-800">Gestión de Categorías y Servicios</h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
                <XMarkIcon className="h-6 w-6 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 bg-white">
              {/* Categorías */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-700">Categorías</h3>
                    <p className="text-sm text-gray-500">Haz clic en una categoría para gestionar sus servicios</p>
                  </div>
                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    onClick={() => setShowCategoriaModal(true)}
                  >
                    <PlusIcon className="h-4 w-4" /> Nueva categoría
                  </button>
                </div>
                {ready && (
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="categorias-droppable">
                      {(provided: DroppableProvided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps} className="overflow-x-auto rounded-xl border">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="bg-gray-50">
                                <th className="px-2 py-2 w-8"></th>
                                <th className="px-4 py-2 text-left font-semibold">Nombre</th>
                                <th className="px-4 py-2 text-center font-semibold">Acciones</th>
                              </tr>
                            </thead>
                            <tbody>
                              {loadingCategorias ? (
                                <tr><td colSpan={3} className="text-center py-4">Cargando...</td></tr>
                              ) : categorias.length === 0 ? (
                                <tr><td colSpan={3} className="text-center py-4 text-gray-400">Sin categorías</td></tr>
                              ) : (
                                categorias.map((cat, idx) => (
                                  <Draggable key={cat.id} draggableId={cat.id} index={idx}>
                                    {(provided: DraggableProvided) => (
                                      <tr
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className={`hover:bg-gray-50 cursor-pointer ${categoriaSeleccionada?.id === cat.id ? 'bg-blue-50' : ''}`}
                                      >
                                        <td className="px-2 py-2 cursor-grab">
                                          <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="5" cy="6" r="1.5" fill="#888"/><circle cx="5" cy="12" r="1.5" fill="#888"/><circle cx="5" cy="18" r="1.5" fill="#888"/><circle cx="12" cy="6" r="1.5" fill="#888"/><circle cx="12" cy="12" r="1.5" fill="#888"/><circle cx="12" cy="18" r="1.5" fill="#888"/></svg>
                                        </td>
                                        <td 
                                          className="px-4 py-3 font-medium text-gray-900 cursor-pointer" 
                                          onClick={() => handleSeleccionarCategoria(cat)}
                                        >
                                          {cat.nombre}
                                        </td>
                                        <td className="px-4 py-2 text-center flex gap-2 justify-center">
                                          <button 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleEditCategoria(cat);
                                            }} 
                                            className="p-1 rounded hover:bg-blue-100"
                                            title="Editar categoría"
                                          >
                                            <PencilIcon className="h-4 w-4 text-blue-600" />
                                          </button>
                                          <button 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteCategoria(cat);
                                            }} 
                                            className="p-1 rounded hover:bg-red-100"
                                            title="Eliminar categoría"
                                          >
                                            <TrashIcon className="h-4 w-4 text-red-600" />
                                          </button>
                                        </td>
                                      </tr>
                                    )}
                                  </Draggable>
                                ))
                              )}
                              {provided.placeholder}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                )}
              </div>

              {/* Servicios de la categoría seleccionada */}
              {categoriaSeleccionada && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-700">
                        Servicios de "{categoriaSeleccionada.nombre}"
                      </h3>
                      <p className="text-sm text-gray-500">
                        Gestiona los servicios de esta categoría
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
                    {loadingServicios ? (
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
                                      onClick={() => handleEditServicio(servicio)}
                                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                      title="Editar servicio"
                                    >
                                      <PencilIcon className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteServicio(servicio)}
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
                </div>
              )}

              {/* Modal para nueva categoría */}
              {showCategoriaModal && (
                <Modal open={showCategoriaModal} onClose={() => { setShowCategoriaModal(false); setEditCategoria(null); }}>
                  <form onSubmit={handleSubmitCategoria} className="flex flex-col gap-4 p-6 w-full max-w-xs mx-auto">
                    <h3 className="font-semibold text-lg mb-2">{editCategoria ? 'Editar categoría' : 'Nueva categoría'}</h3>
                    <input
                      name="nombre"
                      type="text"
                      placeholder="Nombre"
                      className="px-3 py-2 border rounded focus:outline-none"
                      value={formCategoria.nombre}
                      onChange={handleCategoriaForm}
                      required
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                      >
                        {editCategoria ? 'Actualizar' : 'Crear'}
                      </button>
                      <button
                        type="button"
                        className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium"
                        onClick={() => { setShowCategoriaModal(false); setEditCategoria(null); }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </Modal>
              )}
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Modal para crear/editar servicio */}
      {showServicioModal && (
        <Modal open={showServicioModal} onClose={() => { 
          setShowServicioModal(false); 
          setEditServicio(null); 
          setFormServicio({ nombre: '', precio: '' }); 
        }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-auto">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900">
                {editServicio ? 'Editar Servicio' : 'Nuevo Servicio'}
              </h3>
              <p className="text-sm text-gray-500">
                {editServicio ? 'Modifica los datos del servicio' : 'Agrega un nuevo servicio a la categoría'}
              </p>
            </div>

            <form onSubmit={handleSubmitServicio} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Servicio
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formServicio.nombre}
                  onChange={handleServicioForm}
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
                    onChange={handleServicioForm}
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
                  onClick={() => { setShowServicioModal(false); setEditServicio(null); setFormServicio({ nombre: '', precio: '' }); }}
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