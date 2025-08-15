import { useState, useEffect } from 'react';
import { FiDollarSign, FiLink, FiFileText, FiX, FiCheck, FiRotateCcw } from 'react-icons/fi';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { getMetodosPago, updateFactura, regenerateFacturaPDF } from '../services/api';
import { clearFacturaCache } from '../utils/urls';

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
    
    // Mostrar alert de loading
    Swal.fire({
      title: 'Completando pago...',
      text: 'Por favor espera mientras procesamos el pago',
      icon: 'info',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    
    try {
      // Actualizar la factura con el pago completado
      await updateFactura(factura.id, {
        estado: 'pagada',
        metodo_pago_id: metodoSeleccionado.id,
        fecha_pago: new Date().toISOString(),
        balance_restante: 0 // Cambiar balance pendiente a 0
      });
      
      // Intentar regenerar el PDF usando el endpoint específico
      try {
        await regenerateFacturaPDF(factura.id);
        clearFacturaCache(factura.id);
      } catch (pdfError) {
        console.warn('Error al regenerar PDF:', pdfError);
        // Fallback: limpiar caché del navegador
        clearFacturaCache(factura.id);
      }
      
      // Cerrar el alert de loading
      Swal.close();
      
      setPagoCompletado(true);
      
      // Mostrar alert de éxito arriba
      Swal.fire({
        title: '¡Pago Completado!',
        text: `El pago se ha completado exitosamente mediante ${metodoSeleccionado.nombre}`,
        icon: 'success',
        confirmButtonColor: '#10b981',
        confirmButtonText: 'Entendido'
      });
      
      onPagoCompletado();
    } catch (error) {
      // Cerrar el alert de loading en caso de error
      Swal.close();
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
      
      // Intentar regenerar el PDF usando el endpoint específico
      try {
        await regenerateFacturaPDF(factura.id);
        clearFacturaCache(factura.id);
        toast.success('PDF regenerado exitosamente');
      } catch (pdfError) {
        console.warn('Error al regenerar PDF:', pdfError);
        // Fallback: limpiar caché del navegador
        clearFacturaCache(factura.id);
      }
      
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-1 sm:p-2 md:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] sm:max-h-[95vh] md:max-h-[98vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-2 sm:p-3 md:p-4 lg:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
              <FiDollarSign className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100">
                {pagoCompletado ? 'Pago Completado' : 'Completar Pago'}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                {pagoCompletado ? 'El pago ha sido procesado exitosamente' : 'Selecciona el método de pago utilizado'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors"
          >
            <FiX className="h-3 w-3 sm:h-4 sm:w-4" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-2 sm:p-3 md:p-6 overflow-y-auto flex-1 min-h-0">
          {/* Información de la factura */}
          <div className="mb-3 sm:mb-4 md:mb-6 p-2 sm:p-3 md:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 text-sm sm:text-base">
              Factura #{factura?.numero_factura || factura?.id}
            </h3>
            <div className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
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
            <div className="space-y-2 sm:space-y-3 md:space-y-4">
              <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100">
                Método de Pago
              </h3>
              
              {loading ? (
                <div className="text-center py-6 sm:py-8">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2 text-sm">Cargando métodos...</p>
                </div>
              ) : metodos.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <FiDollarSign className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No hay métodos de pago disponibles
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Configura métodos de pago en la sección de configuración
                  </p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {metodos
                    .sort((a, b) => a.orden - b.orden)
                    .map((metodo) => (
                    <div
                      key={metodo.id}
                      onClick={() => setMetodoSeleccionado(metodo)}
                      className={`p-2 sm:p-3 md:p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                        metodoSeleccionado?.id === metodo.id
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-blue-300 dark:hover:border-blue-500'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 sm:gap-3 mb-2">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                              {metodo.nombre}
                            </h4>
                            {metodoSeleccionado?.id === metodo.id && (
                              <div className="w-4 h-4 sm:w-5 sm:h-5 bg-green-500 rounded-full flex items-center justify-center">
                                <FiCheck className="h-2 w-2 sm:h-3 sm:w-3 text-white" />
                              </div>
                            )}
                          </div>
                          
                          {metodo.link && (
                            <div className="flex items-center gap-2 mb-2">
                              <FiLink className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                              <a
                                href={metodo.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Pagar con {metodo.nombre}
                              </a>
                            </div>
                          )}
                          
                          {metodo.descripcion && (
                            <div className="flex items-start gap-2">
                              <FiFileText className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 mt-0.5" />
                              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
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
            <div className="text-center py-6 sm:py-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCheck className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                ¡Pago Completado!
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                El pago ha sido procesado exitosamente mediante {metodoSeleccionado?.nombre}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 sm:gap-3 p-2 sm:p-3 md:p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800">
          {pagoCompletado ? (
            <>
              <button
                onClick={handleRevertirPago}
                disabled={procesando}
                className="flex-1 px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xs sm:text-sm md:text-base"
              >
                <FiRotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
                {procesando ? 'Revirtiendo...' : 'Revertir Pago'}
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-xs sm:text-sm md:text-base"
              >
                Cerrar
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="flex-1 px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-xs sm:text-sm md:text-base"
              >
                Cancelar
              </button>
              <button
                onClick={handleCompletarPago}
                disabled={!metodoSeleccionado || procesando}
                className="flex-1 px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm md:text-base"
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
