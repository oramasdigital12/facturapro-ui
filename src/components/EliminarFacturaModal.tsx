import { useState } from 'react';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { softDeleteFactura, hardDeleteFactura } from '../services/api';

interface EliminarFacturaModalProps {
  open: boolean;
  onClose: () => void;
  factura: any;
  onEliminada: () => void;
}

export default function EliminarFacturaModal({ 
  open, 
  onClose, 
  factura, 
  onEliminada
}: EliminarFacturaModalProps) {
  const [loading, setLoading] = useState(false);
  const [tipoEliminacion, setTipoEliminacion] = useState<'soft' | 'hard'>('soft');

  if (!open || !factura) return null;

  const handleEliminar = async () => {
    if (!factura.id) {
      toast.error('ID de factura inválido');
      return;
    }

    setLoading(true);
    try {
      if (tipoEliminacion === 'soft') {
        // Soft Delete - Marcar como eliminada y mover a backup
        await softDeleteFactura(factura.id);
        toast.success('Factura movida a papelera. Puedes restaurarla desde la configuración.');
      } else {
        // Hard Delete - Eliminación completa con confirmación adicional
        const result = await Swal.fire({
          title: '⚠️ Eliminación Permanente',
          html: `
            <div class="text-left space-y-3">
              <p class="text-red-600 font-semibold">Esta acción NO se puede deshacer:</p>
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
          reverseButtons: true,
          customClass: {
            confirmButton: 'bg-red-600 hover:bg-red-700',
            cancelButton: 'bg-gray-500 hover:bg-gray-600'
          }
        });

        if (result.isConfirmed) {
          await hardDeleteFactura(factura.id);
          toast.success('Factura eliminada permanentemente');
        } else {
          setLoading(false);
          return;
        }
      }

      onEliminada();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar la factura');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = () => {
    if (loading) return;
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75" onClick={handleCancelar}></div>

        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-50 to-red-100 px-6 py-4 border-b border-red-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-red-800">
                🗑️ Eliminar Factura
              </h3>
              <button
                onClick={handleCancelar}
                className="text-red-600 hover:text-red-800 transition-colors"
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
            <div className="mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">
                Factura #{factura.numero_factura || factura.id}
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                Cliente: {factura.cliente?.nombre || 'Cliente no disponible'}
              </p>
            </div>

            {/* Opciones de eliminación */}
            <div className="space-y-3 mb-6">
              <div className="flex items-start space-x-3">
                <input
                  type="radio"
                  id="soft-delete"
                  name="delete-type"
                  value="soft"
                  checked={tipoEliminacion === 'soft'}
                  onChange={(e) => setTipoEliminacion(e.target.value as 'soft' | 'hard')}
                  className="mt-1 text-blue-600 focus:ring-blue-500"
                  disabled={loading}
                />
                <label htmlFor="soft-delete" className="flex-1">
                  <div className="font-medium text-gray-900">📁 Mover a Papelera (Recomendado)</div>
                  <div className="text-sm text-gray-600 mt-1">
                    • La factura se marca como eliminada pero se conserva
                    • El archivo PDF se mueve a backup automáticamente
                    • Puedes restaurarla en cualquier momento
                    • Cumple con requisitos legales de retención
                  </div>
                </label>
              </div>

              <div className="flex items-start space-x-3">
                <input
                  type="radio"
                  id="hard-delete"
                  name="delete-type"
                  value="hard"
                  checked={tipoEliminacion === 'hard'}
                  onChange={(e) => setTipoEliminacion(e.target.value as 'soft' | 'hard')}
                  className="mt-1 text-red-600 focus:ring-red-500"
                  disabled={loading}
                />
                <label htmlFor="hard-delete" className="flex-1">
                  <div className="font-medium text-red-700">🗑️ Eliminación Permanente</div>
                  <div className="text-sm text-gray-600 mt-1">
                    • La factura se elimina completamente de la base de datos
                    • El archivo PDF se elimina de Supabase Storage
                    • Esta acción NO se puede deshacer
                    • Solo usar en casos especiales (GDPR, solicitud explícita)
                  </div>
                </label>
              </div>
            </div>

            {/* Advertencia para eliminación permanente */}
            {tipoEliminacion === 'hard' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Eliminación Permanente
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>
                        Esta acción eliminará la factura y su archivo PDF de forma permanente. 
                        No podrás recuperar esta información.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row-reverse gap-3">
            <button
              onClick={handleEliminar}
              disabled={loading}
              className={`w-full sm:w-auto px-4 py-2 rounded-lg font-medium text-white transition-colors ${
                tipoEliminacion === 'soft'
                  ? 'bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400'
                  : 'bg-red-600 hover:bg-red-700 disabled:bg-red-400'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {tipoEliminacion === 'soft' ? 'Moviendo a papelera...' : 'Eliminando...'}
                </div>
              ) : (
                <>
                  {tipoEliminacion === 'soft' ? '📁 Mover a Papelera' : '🗑️ Eliminar Permanentemente'}
                </>
              )}
            </button>
            
            <button
              onClick={handleCancelar}
              disabled={loading}
              className="w-full sm:w-auto px-4 py-2 rounded-lg font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
