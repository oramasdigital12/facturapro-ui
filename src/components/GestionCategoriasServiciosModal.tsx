import { Dialog } from '@headlessui/react';
import { XMarkIcon, PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
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
  const [servicios, setServicios] = useState<ServicioNegocio[]>([]);
  const [loadingServicios, setLoadingServicios] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<CategoriaNegocio | null>(null);
  const [editServicio, setEditServicio] = useState<ServicioNegocio | null>(null);
  const [formServicio, setFormServicio] = useState({ nombre: '', precio: '' });
  const [showServicioModal, setShowServicioModal] = useState(false);

  // Cargar categorías al abrir
  useEffect(() => {
    if (open) cargarCategorias();
    // eslint-disable-next-line
  }, [open]);

  // Cargar servicios al seleccionar categoría
  useEffect(() => {
    if (categoriaSeleccionada) cargarServicios(categoriaSeleccionada.id);
    else setServicios([]);
    // eslint-disable-next-line
  }, [categoriaSeleccionada]);

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

  const cargarServicios = async (categoria_id: string) => {
    setLoadingServicios(true);
    try {
      const res = await getServiciosNegocio(categoria_id);
      setServicios(res.data);
    } catch {
      setServicios([]);
    } finally {
      setLoadingServicios(false);
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
      if (categoriaSeleccionada?.id === cat.id) setCategoriaSeleccionada(null);
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

  // --- Servicio ---
  const handleServicioForm = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormServicio({ ...formServicio, [e.target.name]: e.target.value });
  };
  const handleSubmitServicio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formServicio.nombre.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    if (!formServicio.precio || isNaN(Number(formServicio.precio))) {
      toast.error('Precio inválido');
      return;
    }
    try {
      if (editServicio) {
        await updateServicioNegocio(editServicio.id, {
          nombre: formServicio.nombre,
          precio: Number(formServicio.precio),
          categoria_id: categoriaSeleccionada!.id,
        });
        toast.success('Servicio actualizado');
      } else {
        await createServicioNegocio({
          nombre: formServicio.nombre,
          precio: Number(formServicio.precio),
          categoria_id: categoriaSeleccionada!.id,
        });
        toast.success('Servicio creado');
      }
      setFormServicio({ nombre: '', precio: '' });
      setEditServicio(null);
      setShowServicioModal(false);
      cargarServicios(categoriaSeleccionada!.id);
    } catch {
      toast.error('Error al guardar el servicio');
    }
  };
  const handleEditServicio = (serv: ServicioNegocio) => {
    setEditServicio(serv);
    setFormServicio({ nombre: serv.nombre, precio: serv.precio.toString() });
    setShowServicioModal(true);
  };
  const handleDeleteServicio = async (serv: ServicioNegocio) => {
    const result = await Swal.fire({
      title: '¿Eliminar servicio?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (!result.isConfirmed) return;
    try {
      await deleteServicioNegocio(serv.id);
      toast.success('Servicio eliminado');
      cargarServicios(categoriaSeleccionada!.id);
    } catch {
      toast.error('Error al eliminar');
    }
  };

  if (!open) return null;
  return (
    <Dialog open={open} onClose={onClose} className="relative z-[100]">
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full rounded-2xl bg-white p-0 shadow-lg relative flex flex-col max-h-[90vh]">
          <div className="flex items-center justify-between px-6 pt-6 pb-2 border-b">
            <h2 className="text-xl font-bold text-gray-800">Gestión de Categorías y Servicios</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
              <XMarkIcon className="h-6 w-6 text-gray-500" />
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 bg-white">
            {/* Categorías */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg text-gray-700">Categorías</h3>
                <button
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                  onClick={() => setShowCategoriaModal(true)}
                >
                  <PlusIcon className="h-4 w-4" /> Nueva categoría
                </button>
              </div>
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="categorias-droppable">
                  {(provided: DroppableProvided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="overflow-x-auto rounded-xl border"
                    >
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-2 py-2 w-8"></th>
                            <th className="px-4 py-2 text-left font-semibold">Nombre</th>
                            <th className="px-4 py-2 text-center font-semibold">Acciones</th>
                          </tr>
                        </thead>
                        <Droppable droppableId="categorias-droppable">
                          {(provided: DroppableProvided) => (
                            <tbody
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                            >
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
                                        className={categoriaSeleccionada?.id === cat.id ? 'bg-blue-50' : ''}
                                      >
                                        <td className="px-2 py-2 cursor-grab" {...provided.dragHandleProps}>
                                          <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="5" cy="6" r="1.5" fill="#888"/><circle cx="5" cy="12" r="1.5" fill="#888"/><circle cx="5" cy="18" r="1.5" fill="#888"/><circle cx="12" cy="6" r="1.5" fill="#888"/><circle cx="12" cy="12" r="1.5" fill="#888"/><circle cx="12" cy="18" r="1.5" fill="#888"/></svg>
                                        </td>
                                        <td className="px-4 py-2 cursor-pointer" onClick={() => setCategoriaSeleccionada(cat)}>{cat.nombre}</td>
                                        <td className="px-4 py-2 text-center flex gap-2 justify-center">
                                          <button onClick={() => handleEditCategoria(cat)} className="p-1 rounded hover:bg-blue-100"><PencilIcon className="h-4 w-4 text-blue-600" /></button>
                                          <button onClick={() => handleDeleteCategoria(cat)} className="p-1 rounded hover:bg-red-100"><TrashIcon className="h-4 w-4 text-red-600" /></button>
                                        </td>
                                      </tr>
                                    )}
                                  </Draggable>
                                ))
                              )}
                              {provided.placeholder}
                            </tbody>
                          )}
                        </Droppable>
                      </table>
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
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
            {/* Servicios */}
            {categoriaSeleccionada && (
              <div>
                <div className="flex items-center justify-between mb-2 mt-6">
                  <h3 className="font-semibold text-lg text-gray-700">Servicios de "{categoriaSeleccionada.nombre}"</h3>
                  <button
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    onClick={() => {
                      setShowServicioModal(true);
                      setEditServicio(null);
                      setFormServicio({ nombre: '', precio: '' });
                    }}
                  >
                    <PlusIcon className="h-4 w-4" /> Nuevo servicio
                  </button>
                </div>
                <div className="overflow-x-auto rounded-xl border">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-left font-semibold">Nombre</th>
                        <th className="px-4 py-2 text-left font-semibold">Precio</th>
                        <th className="px-4 py-2 text-center font-semibold">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingServicios ? (
                        <tr><td colSpan={3} className="text-center py-4">Cargando...</td></tr>
                      ) : servicios.length === 0 ? (
                        <tr><td colSpan={3} className="text-center py-4 text-gray-400">Sin servicios</td></tr>
                      ) : (
                        servicios.map(serv => (
                          <tr key={serv.id}>
                            <td className="px-4 py-2">{serv.nombre}</td>
                            <td className="px-4 py-2">${serv.precio.toFixed(2)}</td>
                            <td className="px-4 py-2 text-center flex gap-2 justify-center">
                              <button onClick={() => handleEditServicio(serv)} className="p-1 rounded hover:bg-blue-100"><PencilIcon className="h-4 w-4 text-blue-600" /></button>
                              <button onClick={() => handleDeleteServicio(serv)} className="p-1 rounded hover:bg-red-100"><TrashIcon className="h-4 w-4 text-red-600" /></button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {/* Modal para nuevo servicio */}
            {showServicioModal && (
              <Modal open={showServicioModal} onClose={() => { setShowServicioModal(false); setEditServicio(null); setFormServicio({ nombre: '', precio: '' }); }}>
                <form onSubmit={handleSubmitServicio} className="flex flex-col gap-4 p-6 w-full max-w-xs mx-auto">
                  <h3 className="font-semibold text-lg mb-2">{editServicio ? 'Editar servicio' : 'Nuevo servicio'}</h3>
                  <input
                    name="nombre"
                    type="text"
                    placeholder="Nombre"
                    className="px-3 py-2 border rounded focus:outline-none"
                    value={formServicio.nombre}
                    onChange={handleServicioForm}
                    required
                  />
                  <input
                    name="precio"
                    type="number"
                    step="0.01"
                    placeholder="Precio"
                    className="px-3 py-2 border rounded focus:outline-none"
                    value={formServicio.precio}
                    onChange={handleServicioForm}
                    required
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                      {editServicio ? 'Actualizar' : 'Crear'}
                    </button>
                    <button
                      type="button"
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium"
                      onClick={() => { setShowServicioModal(false); setEditServicio(null); setFormServicio({ nombre: '', precio: '' }); }}
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
  );
} 