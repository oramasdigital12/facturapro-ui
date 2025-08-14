import { useState, useEffect } from 'react';
import { FiDollarSign, FiLink, FiFileText, FiX, FiCheck, FiRotateCcw } from 'react-icons/fi';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { getMetodosPago, updateFactura } from '../services/api';

interface MetodoPago {
  id: string;
  nombre: string;
  link?: string;
  descripcion?: string;
  activo: boolean;
  orden: number;
}

interface CompletarPagoModalProps {
  open: boolean;
  onClose: () => void;
  factura: any;
  onPagoCompletado: () => void;
}

export default function CompletarPagoModal({ open, onClose, factura, onPagoCompletado }: CompletarPagoModalProps) {
  const [metodos, setMetodos] = useState<MetodoPago[]>([]);
  const [loading, setLoading] = useState(false);
  const [metodoSeleccionado, setMetodoSeleccionado] = useState<MetodoPago | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [pagoCompletado, setPagoCompletado] = useState(false);
  const [facturaOriginal, setFacturaOriginal] = useState<any>(null);

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
      setPagoCompletado(false);
      // Guardar estado original de la factura
      setFacturaOriginal(factura);
    }
  }, [open, factura]);

  // Completar pago
  const handleCompletarPago = async () => {
    if (!metodoSeleccionado) {
      toast.error('Selecciona un método de pago');
      return;
    }

    const result = await Swal.fire({
      title: '¿Completar pago?',
      text: `¿Confirmas que el pago se realizó mediante ${metodoSeleccionado.nombre}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, completar pago',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    setProcesando(true);
    try {
      // Actualizar la factura con el pago completado
      await updateFactura(factura.id, {
        estado: 'pagada',
        metodo_pago_id: metodoSeleccionado.id,
        fecha_pago: new Date().toISOString(),
        balance_restante: 0 // Cambiar balance pendiente a 0
      });
      
      // El backend debería regenerar el PDF con el estado pagado
      // y actualizar el pdfUrl automáticamente
      
      setPagoCompletado(true);
      toast.success('Pago completado exitosamente');
      onPagoCompletado();
    } catch (error) {
      toast.error('Error al completar el pago');
    } finally {
      setProcesando(false);
    }
  };

  // Revertir pago
  const handleRevertirPago = async () => {
    const result = await Swal.fire({
      title: '¿Revertir pago?',
      text: '¿Estás seguro de que quieres revertir el pago? Esto restaurará el estado original de la factura.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, revertir',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    setProcesando(true);
    try {
      // Restaurar estado original
      await updateFactura(factura.id, {
        estado: facturaOriginal?.estado || 'pendiente',
        metodo_pago_id: null,
        fecha_pago: null,
        balance_restante: facturaOriginal?.balance_restante || factura.total
      });
      
      setPagoCompletado(false);
      setMetodoSeleccionado(null);
      toast.success('Pago revertido exitosamente');
      onPagoCompletado();
    } catch (error) {
      toast.error('Error al revertir el pago');
    } finally {
      setProcesando(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
              <FiDollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {pagoCompletado ? 'Pago Completado' : 'Completar Pago'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {pagoCompletado ? 'El pago ha sido procesado exitosamente' : 'Selecciona el método de pago utilizado'}
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
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Factura #{factura?.numero_factura || factura?.id}
            </h3>
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p><strong>Cliente:</strong> {factura?.cliente?.nombre}</p>
              <p><strong>Total:</strong> ${factura?.total?.toFixed(2)}</p>
              {!pagoCompletado && (
                <p><strong>Balance Pendiente:</strong> ${factura?.balance_restante?.toFixed(2)}</p>
              )}
              {pagoCompletado && (
                <p><strong>Estado:</strong> <span className="text-green-600 font-bold">Pagada</span></p>
              )}
              {pagoCompletado && metodoSeleccionado && (
                <p><strong>Método de Pago:</strong> {metodoSeleccionado.nombre}</p>
              )}
            </div>
          </div>

          {!pagoCompletado ? (
            /* Selección de método */
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
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
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
                              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                <FiCheck className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </div>
                          
                          {metodo.link && (
                            <div className="flex items-center gap-2 mb-2">
                              <FiLink className="h-4 w-4 text-blue-500" />
                              <a
                                href={metodo.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Pagar con {metodo.nombre}
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
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Estado de pago completado */
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCheck className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                ¡Pago Completado!
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                El pago ha sido procesado exitosamente mediante {metodoSeleccionado?.nombre}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          {pagoCompletado ? (
            <>
              <button
                onClick={handleRevertirPago}
                disabled={procesando}
                className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <FiRotateCcw className="h-4 w-4" />
                {procesando ? 'Revirtiendo...' : 'Revertir Pago'}
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cerrar
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCompletarPago}
                disabled={!metodoSeleccionado || procesando}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {procesando ? 'Completando...' : 'Completar Pago'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
