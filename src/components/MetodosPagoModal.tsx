import { useState, useEffect } from 'react';
import { FiDollarSign, FiLink, FiFileText, FiX, FiCheck, FiMessageCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { getMetodosPago } from '../services/api';

interface MetodoPago {
  id: string;
  nombre: string;
  link?: string;
  descripcion?: string;
  activo: boolean;
  orden: number;
}

interface MetodosPagoModalProps {
  open: boolean;
  onClose: () => void;
  factura: any;
  onMetodoSeleccionado: (metodo: MetodoPago) => void;
  tipoMensaje: 'whatsapp' | 'email';
}

export default function MetodosPagoModal({ 
  open, 
  onClose, 
  factura, 
  onMetodoSeleccionado, 
  tipoMensaje 
}: MetodosPagoModalProps) {
  const [metodos, setMetodos] = useState<MetodoPago[]>([]);
  const [loading, setLoading] = useState(false);
  const [metodoSeleccionado, setMetodoSeleccionado] = useState<MetodoPago | null>(null);

  // Cargar métodos de pago activos
  const fetchMetodos = async () => {
    setLoading(true);
    try {
      const response = await getMetodosPago();
      // Filtrar solo métodos activos
      const metodosActivos = (response.data || []).filter((metodo: MetodoPago) => metodo.activo);
      setMetodos(metodosActivos);
    } catch (error) {
      toast.error('Error al cargar métodos de pago');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchMetodos();
      setMetodoSeleccionado(null);
    }
  }, [open]);

  const handleConfirmar = () => {
    if (!metodoSeleccionado) {
      toast.error('Selecciona un método de pago');
      return;
    }
    onMetodoSeleccionado(metodoSeleccionado);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-75 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
              <FiMessageCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Seleccionar Método de Pago
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Elige el método de pago para incluir en el mensaje de {tipoMensaje === 'whatsapp' ? 'WhatsApp' : 'Email'}
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
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Información de la factura */}
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
            <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
              Factura #{factura?.numero_factura || factura?.id} - Pendiente
            </h3>
            <div className="text-sm text-yellow-700 dark:text-yellow-300">
              <p><strong>Cliente:</strong> {factura?.cliente?.nombre}</p>
              <p><strong>Total:</strong> ${factura?.total?.toFixed(2)}</p>
              <p><strong>Balance Pendiente:</strong> ${factura?.balance_restante?.toFixed(2)}</p>
            </div>
          </div>

          {/* Selección de método */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Método de Pago
            </h3>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Cargando métodos...</p>
              </div>
            ) : metodos.length === 0 ? (
              <div className="text-center py-8">
                <FiDollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No hay métodos de pago disponibles
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Configura métodos de pago en la sección de configuración
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {metodos
                  .sort((a, b) => a.orden - b.orden)
                  .map((metodo) => (
                  <div
                    key={metodo.id}
                    onClick={() => setMetodoSeleccionado(metodo)}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                      metodoSeleccionado?.id === metodo.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-blue-300 dark:hover:border-blue-500'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                            {metodo.nombre}
                          </h4>
                          {metodoSeleccionado?.id === metodo.id && (
                            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                              <FiCheck className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>
                        
                        {metodo.link && (
                          <div className="flex items-center gap-2 mb-2">
                            <FiLink className="h-4 w-4 text-blue-500" />
                            <span className="text-sm text-blue-600 dark:text-blue-400">
                              Link de pago disponible
                            </span>
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={!metodoSeleccionado}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continuar con {tipoMensaje === 'whatsapp' ? 'WhatsApp' : 'Email'}
          </button>
        </div>
      </div>
    </div>
  );
}
