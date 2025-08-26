import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { getFacturasEliminadas, restoreFactura, hardDeleteFactura } from '../services/api';
import { getNumeroFactura } from '../utils/facturaHelpers';

interface GestionFacturasEliminadasModalProps {
  open: boolean;
  onClose: () => void;
  onFacturaRestaurada?: () => void;
}

interface FacturaEliminada {
  id: string;
  numero_factura: string;
  cliente: {
    nombre: string;
    email?: string;
  };
  total: number;
  fecha_factura: string;
  deleted_at: string;
  deleted_by: string;
  deletion_reason: string;
}

export default function GestionFacturasEliminadasModal({ 
  open, 
  onClose, 
  onFacturaRestaurada 
}: GestionFacturasEliminadasModalProps) {
  const [facturasEliminadas, setFacturasEliminadas] = useState<FacturaEliminada[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingFacturas, setLoadingFacturas] = useState(false);

  useEffect(() => {
    if (open) {
      fetchFacturasEliminadas();
    }
  }, [open]);

  const fetchFacturasEliminadas = async () => {
    setLoadingFacturas(true);
    try {
      const response = await getFacturasEliminadas();
      setFacturasEliminadas(response.data || []);
    } catch (error: any) {
      console.error('Error al cargar facturas eliminadas:', error);
      if (error.response?.status === 400) {
        toast.error('Error de validación en el servidor. Contacta al administrador.');
      } else {
        toast.error(error.message || 'Error al cargar facturas eliminadas');
      }
    } finally {
      setLoadingFacturas(false);
    }
  };

  const handleRestaurar = async (factura: FacturaEliminada) => {
    const result = await Swal.fire({
      title: '¿Restaurar factura?',
      html: `
        <div class="text-left space-y-3">
          <p>¿Estás seguro de que quieres restaurar esta factura?</p>
          <div class="bg-blue-50 p-3 rounded-lg">
            <p class="font-semibold">Factura #${getNumeroFactura(factura)}</p>
            <p class="text-sm text-gray-600">Cliente: ${factura.cliente.nombre}</p>
            <p class="text-sm text-gray-600">Total: $${factura.total?.toFixed(2)}</p>
          </div>
          <p class="text-sm text-gray-600">La factura volverá a aparecer en tu lista principal.</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, restaurar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        await restoreFactura(factura.id);
        toast.success('Factura restaurada exitosamente');
        fetchFacturasEliminadas(); // Recargar lista
        onFacturaRestaurada?.(); // Notificar al componente padre
      } catch (error: any) {
        toast.error(error.message || 'Error al restaurar la factura');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEliminarPermanente = async (factura: FacturaEliminada) => {
    const result = await Swal.fire({
      title: '⚠️ Eliminación Permanente',
      html: `
        <div class="text-left space-y-3">
          <p class="text-red-600 font-semibold">Esta acción NO se puede deshacer:</p>
          <div class="bg-red-50 p-3 rounded-lg border border-red-200">
            <p class="font-semibold">Factura #${getNumeroFactura(factura)}</p>
            <p class="text-sm">Cliente: ${factura.cliente.nombre}</p>
            <p class="text-sm">Total: $${factura.total?.toFixed(2)}</p>
          </div>
          <ul class="list-disc list-inside space-y-1 text-sm">
            <li>La factura se eliminará permanentemente de la base de datos</li>
            <li>El archivo PDF se eliminará de Supabase Storage</li>
            <li>No podrás recuperar esta información</li>
          </ul>
          <p class="text-gray-600 mt-3">¿Estás completamente seguro?</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'SÍ, ELIMINAR PERMANENTEMENTE',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        await hardDeleteFactura(factura.id);
        toast.success('Factura eliminada permanentemente');
        fetchFacturasEliminadas(); // Recargar lista
      } catch (error: any) {
        toast.error(error.message || 'Error al eliminar la factura');
      } finally {
        setLoading(false);
      }
    }
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 px-6 py-4 border-b border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-orange-800">
                  🗑️ Papelera - Facturas Eliminadas
                </h3>
                <p className="text-sm text-orange-600 mt-1">
                  Gestiona las facturas que has movido a la papelera
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-orange-600 hover:text-orange-800 transition-colors"
                disabled={loading}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            {loadingFacturas ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                <span className="ml-3 text-gray-600">Cargando facturas eliminadas...</span>
              </div>
            ) : facturasEliminadas.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🗑️</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Papelera vacía</h3>
                <p className="text-gray-600">No hay facturas eliminadas en la papelera</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900">
                    Facturas en papelera ({facturasEliminadas.length})
                  </h4>
                  <div className="text-sm text-gray-500">
                    Las facturas se conservan por 7 años
                  </div>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {facturasEliminadas.map((factura) => (
                    <div key={factura.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-semibold text-gray-900">
                              #{getNumeroFactura(factura)}
                            </span>
                            <span className="text-sm text-gray-500">
                              Eliminada el {formatFecha(factura.deleted_at)}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                            <div>
                              <span className="text-gray-500">Cliente:</span>
                              <span className="ml-2 font-medium">{factura.cliente.nombre}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Total:</span>
                              <span className="ml-2 font-semibold text-green-600">
                                ${factura.total?.toFixed(2)}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Fecha:</span>
                              <span className="ml-2">{formatFecha(factura.fecha_factura)}</span>
                            </div>
                          </div>

                          {factura.deletion_reason && (
                            <div className="mt-2 text-xs text-gray-500">
                              Razón: {factura.deletion_reason}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleRestaurar(factura)}
                            disabled={loading}
                            className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                            Restaurar
                          </button>
                          
                          <button
                            onClick={() => handleEliminarPermanente(factura)}
                            disabled={loading}
                            className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        Información sobre la papelera
                      </h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <ul className="list-disc list-inside space-y-1">
                          <li>Las facturas eliminadas se conservan por 7 años por cumplimiento legal</li>
                          <li>Puedes restaurar facturas en cualquier momento</li>
                          <li>La eliminación permanente es irreversible</li>
                          <li>Los archivos PDF se mueven automáticamente a backup</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-end">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
