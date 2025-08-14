import { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiDollarSign, FiLink, FiFileText, FiCheck, FiX } from 'react-icons/fi';
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
      text: `¿Estás seguro de que deseas eliminar "${metodo.nombre}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        await deleteMetodoPago(metodo.id!);
        setMetodos(prev => prev.filter(m => m.id !== metodo.id));
        toast.success('Método de pago eliminado');
      } catch (error) {
        toast.error('Error al eliminar método de pago');
      } finally {
        setLoading(false);
      }
    }
  };

  // Cambiar estado activo/inactivo
  const handleToggleActivo = async (metodo: MetodoPago) => {
    try {
      const response = await updateMetodoPago(metodo.id!, { activo: !metodo.activo });
      setMetodos(prev => prev.map(m => 
        m.id === metodo.id ? response.data : m
      ));
      toast.success(`Método ${!metodo.activo ? 'activado' : 'desactivado'}`);
    } catch (error) {
      toast.error('Error al cambiar estado');
    }
  };

  // Validar URL
  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
              <FiDollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Métodos de Pago
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Gestiona las formas de pago para tus facturas
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
          {showForm ? (
            /* Formulario */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {editingMetodo ? 'Editar Método de Pago' : 'Nuevo Método de Pago'}
                </h3>
                <button
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none transition-colors"
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
                      className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none transition-colors"
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
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none transition-colors resize-none"
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

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGuardar}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : (editingMetodo ? 'Actualizar' : 'Crear')}
                </button>
              </div>
            </div>
          ) : (
            /* Lista de métodos */
            <div className="space-y-4">
              {/* Botón crear */}
              <button
                onClick={handleCrear}
                className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl hover:border-blue-400 dark:hover:border-blue-500 transition-colors group"
              >
                <div className="flex items-center justify-center gap-3 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  <FiPlus className="h-5 w-5" />
                  <span className="font-medium">Agregar Método de Pago</span>
                </div>
              </button>

              {/* Lista */}
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Cargando métodos...</p>
                </div>
              ) : metodos.length === 0 ? (
                <div className="text-center py-8">
                  <FiDollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No hay métodos de pago
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Agrega métodos de pago para que tus clientes puedan pagar fácilmente
                  </p>
                  <button
                    onClick={handleCrear}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                  >
                    Agregar Primer Método
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {metodos
                    .sort((a, b) => a.orden - b.orden)
                    .map((metodo) => (
                    <div
                      key={metodo.id}
                      className={`p-4 rounded-2xl border-2 transition-all duration-200 ${
                        metodo.activo
                          ? 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                          : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                              {metodo.nombre}
                            </h4>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                metodo.activo
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {metodo.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </div>
                          
                          {metodo.link && (
                            <div className="flex items-center gap-2 mb-2">
                              <FiLink className="h-4 w-4 text-blue-500" />
                              <a
                                href={metodo.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                {metodo.link}
                              </a>
                            </div>
                          )}
                          
                          {metodo.descripcion && (
                            <div className="flex items-start gap-2">
                              <FiFileText className="h-4 w-4 text-gray-400 mt-0.5" />
                              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                                {metodo.descripcion}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => handleToggleActivo(metodo)}
                            className={`p-2 rounded-xl transition-colors ${
                              metodo.activo
                                ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                                : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                            title={metodo.activo ? 'Desactivar' : 'Activar'}
                          >
                            <FiCheck className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => handleEditar(metodo)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors"
                            title="Editar"
                          >
                            <FiEdit className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => handleEliminar(metodo)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                            title="Eliminar"
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
  );
}
