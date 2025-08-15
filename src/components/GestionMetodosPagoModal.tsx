import { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiDollarSign, FiLink, FiCheck, FiX } from 'react-icons/fi';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { getMetodosPago, createMetodoPago, updateMetodoPago, deleteMetodoPago } from '../services/api';

interface MetodoPago {
  id?: string;
  nombre: string;
  link?: string;
  descripcion?: string;
  activo: boolean;
  orden: number;
}

interface GestionMetodosPagoModalProps {
  open: boolean;
  onClose: () => void;
}

export default function GestionMetodosPagoModal({ open, onClose }: GestionMetodosPagoModalProps) {
  const [metodos, setMetodos] = useState<MetodoPago[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingMetodo, setEditingMetodo] = useState<MetodoPago | null>(null);
  const [formData, setFormData] = useState<MetodoPago>({
    nombre: '',
    link: '',
    descripcion: '',
    activo: true,
    orden: 0
  });

  // Cargar métodos de pago
  const fetchMetodos = async () => {
    setLoading(true);
    try {
      const response = await getMetodosPago();
      setMetodos(response.data || []);
    } catch (error) {
      toast.error('Error al cargar métodos de pago');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchMetodos();
    }
  }, [open]);

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      nombre: '',
      link: '',
      descripcion: '',
      activo: true,
      orden: 0
    });
    setEditingMetodo(null);
  };

  // Abrir formulario para crear
  const handleCrear = () => {
    resetForm();
    setShowForm(true);
  };

  // Abrir formulario para editar
  const handleEditar = (metodo: MetodoPago) => {
    setFormData(metodo);
    setEditingMetodo(metodo);
    setShowForm(true);
  };

  // Guardar método
  const handleGuardar = async () => {
    if (!formData.nombre.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    if (formData.link && !isValidUrl(formData.link)) {
      toast.error('El link debe ser una URL válida');
      return;
    }

    setLoading(true);
    try {
      if (editingMetodo) {
        const response = await updateMetodoPago(editingMetodo.id!, formData);
        setMetodos(prev => prev.map(m => m.id === editingMetodo.id ? response.data : m));
        toast.success('Método de pago actualizado');
      } else {
        const response = await createMetodoPago(formData);
        setMetodos(prev => [...prev, response.data]);
        toast.success('Método de pago creado');
      }
      setShowForm(false);
      resetForm();
    } catch (error) {
      toast.error('Error al guardar método de pago');
    } finally {
      setLoading(false);
    }
  };

  // Eliminar método
  const handleEliminar = async (metodo: MetodoPago) => {
    const result = await Swal.fire({
      title: '¿Eliminar método de pago?',
      text: `¿Estás seguro de que quieres eliminar "${metodo.nombre}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await deleteMetodoPago(metodo.id!);
        setMetodos(prev => prev.filter(m => m.id !== metodo.id));
        toast.success('Método de pago eliminado');
      } catch (error) {
        toast.error('Error al eliminar método de pago');
      }
    }
  };

  // Toggle activo/inactivo
  const handleToggleActivo = async (metodo: MetodoPago) => {
    try {
      const updatedMetodo = { ...metodo, activo: !metodo.activo };
      const response = await updateMetodoPago(metodo.id!, updatedMetodo);
      setMetodos(prev => prev.map(m => m.id === metodo.id ? response.data : m));
      toast.success(`Método ${metodo.activo ? 'desactivado' : 'activado'}`);
    } catch (error) {
      toast.error('Error al actualizar método de pago');
    }
  };

  // Validar URL
  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-2 pt-2 pb-16 text-center sm:block sm:p-0 sm:px-4">
        <div className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75" onClick={onClose}></div>

        <div className="relative inline-block w-full max-w-2xl p-4 my-4 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-2xl rounded-3xl sm:p-6 sm:my-8 flex flex-col max-h-[92vh] sm:max-h-[95vh] md:max-h-[98vh]">
          {/* Header moderno */}
          <div className="flex items-center justify-between mb-4 sm:mb-6 flex-shrink-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <FiDollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
                  Gestión de Métodos de Pago
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Administra los métodos de pago disponibles
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              <FiX className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>

          {/* Contenido principal */}
          <div className="overflow-y-auto flex-1 min-h-0">
            {showForm ? (
              /* Formulario */
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {editingMetodo ? 'Editar Método de Pago' : 'Nuevo Método de Pago'}
                  </h4>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                    }}
                    className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                  >
                    <FiX className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  {/* Nombre */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none transition-colors text-sm"
                      placeholder="Ej: PayPal, ATH Móvil, Efectivo"
                    />
                  </div>

                  {/* Link */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Link de Pago (Opcional)
                    </label>
                    <div className="relative">
                      <FiLink className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="url"
                        value={formData.link}
                        onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                        className="w-full pl-10 pr-3 sm:pr-4 py-2 sm:py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none transition-colors text-sm"
                        placeholder="https://paypal.me/tuempresa"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      URL directa para pagar (PayPal, Stripe, etc.)
                    </p>
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Descripción / Instrucciones (Opcional)
                    </label>
                    <textarea
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      rows={3}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none transition-colors resize-none text-sm"
                      placeholder="Instrucciones paso a paso para pagar..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Usa saltos de línea para pasos separados
                    </p>
                  </div>

                  {/* Activo */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="activo"
                      checked={formData.activo}
                      onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="activo" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Método activo
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              /* Lista de métodos */
              <div className="space-y-3 sm:space-y-4">
                {loading ? (
                  <div className="text-center py-6 sm:py-8">
                    <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2 text-sm">Cargando métodos...</p>
                  </div>
                ) : metodos.length === 0 ? (
                  /* Sin métodos - mostrar botón crear */
                  <div className="text-center py-6 sm:py-8">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <FiDollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                    </div>
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      No hay métodos de pago
                    </h4>
                    <p className="text-gray-500 dark:text-gray-400 mb-4 sm:mb-6 text-sm">
                      Comienza agregando tu primer método de pago
                    </p>
                    <button
                      onClick={handleCrear}
                      className="flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg text-sm"
                    >
                      <FiPlus className="h-4 w-4 sm:h-5 sm:w-5" />
                      Agregar Primer Método
                    </button>
                  </div>
                ) : (
                  /* Lista de métodos existentes */
                  <div className="space-y-3 sm:space-y-4">
                    {/* Botón agregar nuevo */}
                    <button
                      onClick={handleCrear}
                      className="w-full flex items-center justify-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105 shadow-lg text-sm"
                    >
                      <FiPlus className="h-4 w-4" />
                      Agregar Nuevo Método
                    </button>

                    {/* Lista de métodos */}
                    <div className="space-y-2 sm:space-y-3">
                      {metodos.map((metodo) => (
                        <div
                          key={metodo.id}
                          className={`p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 ${
                            metodo.activo
                              ? 'border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                              : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                                <h4 className={`font-semibold text-sm sm:text-base truncate ${
                                  metodo.activo 
                                    ? 'text-green-900 dark:text-green-100' 
                                    : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                  {metodo.nombre}
                                </h4>
                                <span className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ${
                                  metodo.activo
                                    ? 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                }`}>
                                  {metodo.activo ? 'Activo' : 'Inactivo'}
                                </span>
                              </div>
                              
                              {metodo.descripcion && (
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">
                                  {metodo.descripcion}
                                </p>
                              )}
                              
                              {metodo.link && (
                                <div className="flex items-center gap-2 text-xs sm:text-sm">
                                  <FiLink className="h-3 w-3 text-blue-500 flex-shrink-0" />
                                  <a
                                    href={metodo.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 dark:text-blue-400 hover:underline truncate"
                                  >
                                    {metodo.link}
                                  </a>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-1 sm:gap-2 ml-2 sm:ml-4 flex-shrink-0">
                              {/* Toggle activo/inactivo */}
                              <button
                                onClick={() => handleToggleActivo(metodo)}
                                className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                                  metodo.activo
                                    ? 'bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-700'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                                title={metodo.activo ? 'Desactivar' : 'Activar'}
                              >
                                <FiCheck className="h-3 w-3 sm:h-4 sm:w-4" />
                              </button>
                              
                              {/* Editar */}
                              <button
                                onClick={() => handleEditar(metodo)}
                                className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
                                title="Editar"
                              >
                                <FiEdit className="h-3 w-3 sm:h-4 sm:w-4" />
                              </button>
                              
                              {/* Eliminar */}
                              <button
                                onClick={() => handleEliminar(metodo)}
                                className="p-1.5 sm:p-2 bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
                                title="Eliminar"
                              >
                                <FiTrash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Botones fijos en la parte inferior */}
          <div className="bg-white dark:bg-gray-800 pt-3 sm:pt-4 mt-4 sm:mt-6 border-t border-gray-200 dark:border-gray-600 flex-shrink-0">
            {showForm ? (
              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="flex-1 px-3 sm:px-6 py-2 sm:py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGuardar}
                  disabled={loading}
                  className="flex-1 px-3 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
                >
                  {loading ? 'Guardando...' : (editingMetodo ? 'Actualizar' : 'Crear')}
                </button>
              </div>
            ) : (
              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-3 sm:px-6 py-2 sm:py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
