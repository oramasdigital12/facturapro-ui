import { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiFolder, FiPackage, FiX, FiMenu, FiDollarSign } from 'react-icons/fi';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { useOutletContext } from 'react-router-dom';
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
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function GestionCategoriasServiciosModal({ open, onClose }: Props) {
  const outletContext = useOutletContext() as { color_personalizado?: string } | null;
  const color_personalizado = outletContext?.color_personalizado || '#2563eb';

  const [categorias, setCategorias] = useState<CategoriaNegocio[]>([]);
  const [loadingCategorias, setLoadingCategorias] = useState(false);
  const [editCategoria, setEditCategoria] = useState<CategoriaNegocio | null>(null);
  const [formCategoria, setFormCategoria] = useState({ nombre: '', orden: '' });
  const [showCategoriaForm, setShowCategoriaForm] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<CategoriaNegocio | null>(null);

  // Estados para servicios
  const [servicios, setServicios] = useState<ServicioNegocio[]>([]);
  const [loadingServicios, setLoadingServicios] = useState(false);
  const [editServicio, setEditServicio] = useState<ServicioNegocio | null>(null);
  const [formServicio, setFormServicio] = useState({ nombre: '', precio: '' });
  const [showServicioForm, setShowServicioForm] = useState(false);
  const [showServiciosModal, setShowServiciosModal] = useState(false);

  // Cargar categorías al abrir
  useEffect(() => {
    if (open) {
      cargarCategorias();
    }
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
      setShowCategoriaForm(false);
      cargarCategorias();
    } catch {
      toast.error('Error al guardar la categoría');
    }
  };
  
  const handleEditCategoria = (cat: CategoriaNegocio) => {
    setEditCategoria(cat);
    setFormCategoria({ nombre: cat.nombre, orden: cat.orden?.toString() || '' });
    setShowCategoriaForm(true);
  };
  
  const handleDeleteCategoria = async (cat: CategoriaNegocio) => {
    const result = await Swal.fire({
      title: '¿Eliminar categoría?',
      text: `¿Estás seguro de que deseas eliminar "${cat.nombre}"? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
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
    setCategoriaSeleccionada(categoria);
    cargarServicios(categoria.id);
    setShowServiciosModal(true);
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
      setShowServicioForm(false);
      
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
    setShowServicioForm(true);
  };

  const handleDeleteServicio = async (servicio: ServicioNegocio) => {
    const result = await Swal.fire({
      title: '¿Eliminar servicio?',
      text: `¿Estás seguro de que quieres eliminar "${servicio.nombre}"? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
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
    setShowServicioForm(true);
  };

  // Resetear formularios
  const resetCategoriaForm = () => {
    setFormCategoria({ nombre: '', orden: '' });
    setEditCategoria(null);
  };

  const resetServicioForm = () => {
    setFormServicio({ nombre: '', precio: '' });
    setEditServicio(null);
  };

  if (!open) return null;

  return (
    <>
      {/* Modal Principal de Categorías */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: color_personalizado + '20' }}>
                <FiFolder className="h-5 w-5" style={{ color: color_personalizado }} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Categorías y Servicios
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Organiza tus servicios por categorías
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors"
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>

          {/* Contenido */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {showCategoriaForm ? (
              /* Formulario de Categoría */
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {editCategoria ? 'Editar Categoría' : 'Nueva Categoría'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowCategoriaForm(false);
                      resetCategoriaForm();
                    }}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <FiX className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmitCategoria} className="space-y-4">
                  {/* Nombre */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nombre de la Categoría *
                    </label>
                    <input
                      type="text"
                      name="nombre"
                      value={formCategoria.nombre}
                      onChange={handleCategoriaForm}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none transition-colors"
                      style={{ borderColor: 'transparent', '--tw-ring-color': color_personalizado } as any}
                      placeholder="Ej: Diseño Web, Consultoría, Mantenimiento"
                      required
                    />
                  </div>

                  {/* Orden */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Orden de Visualización (Opcional)
                    </label>
                    <input
                      type="number"
                      name="orden"
                      value={formCategoria.orden}
                      onChange={handleCategoriaForm}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none transition-colors"
                      style={{ borderColor: 'transparent', '--tw-ring-color': color_personalizado } as any}
                      placeholder="1, 2, 3..."
                      min="1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Número menor = aparece primero
                    </p>
                  </div>

                  {/* Botones */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCategoriaForm(false);
                        resetCategoriaForm();
                      }}
                      className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 text-white rounded-xl font-medium transition-colors"
                      style={{ backgroundColor: color_personalizado }}
                    >
                      {editCategoria ? 'Actualizar' : 'Crear'} Categoría
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* Vista Principal de Categorías */
              <div className="space-y-4">
                {/* Header de Categorías */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Categorías
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Haz clic en una categoría para gestionar sus servicios
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCategoriaForm(true)}
                    className="flex items-center gap-2 px-4 py-2 text-white rounded-xl transition-colors font-medium"
                    style={{ backgroundColor: color_personalizado }}
                  >
                    <FiPlus className="h-4 w-4" />
                    Nueva Categoría
                  </button>
                </div>

                {/* Lista de Categorías */}
                {loadingCategorias ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: color_personalizado }}></div>
                    <p className="text-gray-500 mt-2">Cargando categorías...</p>
                  </div>
                ) : categorias.length === 0 ? (
                  <div className="text-center py-8">
                    <FiFolder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      No hay categorías
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Crea categorías para organizar tus servicios
                    </p>
                    <button
                      onClick={() => setShowCategoriaForm(true)}
                      className="px-4 py-2 text-white rounded-xl font-medium transition-colors"
                      style={{ backgroundColor: color_personalizado }}
                    >
                      Crear Primera Categoría
                    </button>
                  </div>
                ) : (
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="categorias">
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="space-y-3"
                        >
                          {categorias.map((categoria, index) => (
                            <Draggable key={categoria.id} draggableId={categoria.id} index={index}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className="p-4 rounded-2xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200 cursor-pointer"
                                  onClick={() => handleSeleccionarCategoria(categoria)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div {...provided.dragHandleProps}>
                                        <FiMenu className="h-4 w-4 text-gray-400" />
                                      </div>
                                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: color_personalizado + '20' }}>
                                        <FiFolder className="h-4 w-4" style={{ color: color_personalizado }} />
                                      </div>
                                      <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                          {categoria.nombre}
                                        </h4>
                                        {categoria.orden && (
                                          <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Orden: {categoria.orden}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditCategoria(categoria);
                                        }}
                                        className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
                                        title="Editar categoría"
                                        style={{ color: color_personalizado }}
                                      >
                                        <FiEdit className="h-4 w-4" />
                                      </button>
                                      
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteCategoria(categoria);
                                        }}
                                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                                        title="Eliminar categoría"
                                      >
                                        <FiTrash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Servicios */}
      {showServiciosModal && categoriaSeleccionada && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: color_personalizado + '20' }}>
                  <FiPackage className="h-5 w-5" style={{ color: color_personalizado }} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    Servicios de "{categoriaSeleccionada.nombre}"
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Gestiona los servicios de esta categoría
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowServiciosModal(false)}
                className="w-8 h-8 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>

            {/* Contenido */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {showServicioForm ? (
                /* Formulario de Servicio */
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {editServicio ? 'Editar Servicio' : 'Nuevo Servicio'}
                    </h3>
                    <button
                      onClick={() => {
                        setShowServicioForm(false);
                        resetServicioForm();
                      }}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <FiX className="h-5 w-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmitServicio} className="space-y-4">
                    {/* Nombre */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nombre del Servicio *
                      </label>
                      <input
                        type="text"
                        name="nombre"
                        value={formServicio.nombre}
                        onChange={handleServicioForm}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none transition-colors"
                        style={{ borderColor: 'transparent', '--tw-ring-color': color_personalizado } as any}
                        placeholder="Ej: Diseño de logo, Consulta inicial"
                        required
                      />
                    </div>

                    {/* Precio */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Precio *
                      </label>
                      <div className="relative">
                        <FiDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="number"
                          name="precio"
                          value={formServicio.precio}
                          onChange={handleServicioForm}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none transition-colors"
                          style={{ borderColor: 'transparent', '--tw-ring-color': color_personalizado } as any}
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          required
                        />
                      </div>
                    </div>

                    {/* Botones */}
                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowServicioForm(false);
                          resetServicioForm();
                        }}
                        className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-3 text-white rounded-xl font-medium transition-colors"
                        style={{ backgroundColor: color_personalizado }}
                      >
                        {editServicio ? 'Actualizar' : 'Crear'} Servicio
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                /* Lista de Servicios */
                <div className="space-y-4">
                  {/* Header de Servicios */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Servicios
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Gestiona los servicios de esta categoría
                      </p>
                    </div>
                    <button
                      onClick={handleNuevoServicio}
                      className="flex items-center gap-2 px-4 py-2 text-white rounded-xl transition-colors font-medium"
                      style={{ backgroundColor: color_personalizado }}
                    >
                      <FiPlus className="h-4 w-4" />
                      Nuevo Servicio
                    </button>
                  </div>

                  {/* Lista de Servicios */}
                  {loadingServicios ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: color_personalizado }}></div>
                      <p className="text-gray-500 mt-2">Cargando servicios...</p>
                    </div>
                  ) : servicios.length === 0 ? (
                    <div className="text-center py-8">
                      <FiPackage className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                        No hay servicios
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        Comienza agregando el primer servicio a esta categoría
                      </p>
                      <button
                        onClick={handleNuevoServicio}
                        className="px-4 py-2 text-white rounded-xl font-medium transition-colors"
                        style={{ backgroundColor: color_personalizado }}
                      >
                        Agregar Primer Servicio
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {servicios.map((servicio) => (
                        <div
                          key={servicio.id}
                          className="p-4 rounded-2xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: color_personalizado + '20' }}>
                                <FiPackage className="h-4 w-4" style={{ color: color_personalizado }} />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                  {servicio.nombre}
                                </h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  ${servicio.precio.toFixed(2)}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditServicio(servicio)}
                                className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
                                title="Editar servicio"
                                style={{ color: color_personalizado }}
                              >
                                <FiEdit className="h-4 w-4" />
                              </button>
                              
                              <button
                                onClick={() => handleDeleteServicio(servicio)}
                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                                title="Eliminar servicio"
                              >
                                <FiTrash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
} 