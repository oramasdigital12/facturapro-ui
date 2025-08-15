import {
  PencilIcon,
  TrashIcon,
  PhoneIcon,
  ChatBubbleLeftIcon,
  LinkIcon,
  ArrowUturnLeftIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { deleteFactura, updateFactura, regenerateFacturaPDF } from '../services/api';
import { showDeleteConfirmation } from '../utils/alerts';
import { buildPDFUrl, clearFacturaCache } from '../utils/urls';
import Swal from 'sweetalert2';
import { FiDollarSign, FiCalendar, FiUser } from 'react-icons/fi';
import CompletarPagoModal from './CompletarPagoModal';
import WhatsAppFacturaModal from './WhatsAppFacturaModal';
import EmailFacturaModal from './EmailFacturaModal';

type FacturaItemProps = {
  factura: any;
};

export default function FacturaItem({ factura, onChange }: FacturaItemProps & { onChange?: () => void }) {
  const navigate = useNavigate();
  const [showCompletarPagoModal, setShowCompletarPagoModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  // Validación de UUID
  const esUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id);
  const idValido = factura.id && typeof factura.id === 'string' && esUUID(factura.id);
  const pdfUrl = buildPDFUrl(factura.id);

  // Función para obtener el estado en español
  const getEstadoTexto = (estado: string) => {
    switch (estado) {
      case 'pendiente': return 'Pendiente a Pagar';
      case 'pagada': return 'Pagada';
      case 'borrador': return 'Borrador';
      default: return estado;
    }
  };



  // Función para obtener el icono del estado
  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'pendiente': return '⏳';
      case 'pagada': return '✅';
      case 'borrador': return '📝';
      default: return '📄';
    }
  };

  // Handlers de acciones
  const handleEditar = () => {
    if (idValido) {
      navigate(`/facturas/${factura.id}`);
    } else {
      toast.error('ID de factura inválido');
    }
  };



  const handleDeshacerPagada = async () => {
    if (!idValido) {
      toast.error('ID de factura inválido');
      return;
    }

    // Confirmar antes de deshacer el estado pagado
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

    try {
      toast.loading('Revertiendo pago...', { id: 'deshacerPagada' });
      
      // Restaurar estado original con balance restante
      await updateFactura(factura.id, {
        estado: 'pendiente',
        balance_restante: factura.total // Restaurar el balance al total original
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
      
      toast.dismiss('deshacerPagada');
      toast.success('Pago revertido exitosamente');
      
      onChange && onChange();
    } catch (err: any) {
      toast.dismiss('deshacerPagada');
      toast.error(err.message || 'Error al revertir el pago');
    }
  };

  const handleEliminar = async () => {
    if (!idValido) {
      toast.error('ID de factura inválido');
      return;
    }

    const result = await showDeleteConfirmation('¿Seguro que deseas eliminar esta factura?');
    if (result.isConfirmed) {
      try {
        toast.loading('Eliminando factura...', { id: 'eliminarFactura' });
        
        await deleteFactura(factura.id);
        
        toast.dismiss('eliminarFactura');
        toast.success('Factura eliminada');
        
        onChange && onChange();
      } catch (err: any) {
        toast.dismiss('eliminarFactura');
        toast.error(err.message || 'Error al eliminar');
      }
    }
  };

  const handleLlamar = () => {
    const tel = factura.cliente?.telefono?.replace(/[^\d]/g, '');
    if (tel) {
      window.open(`tel:${tel}`);
    } else {
      toast.error('El cliente no tiene teléfono válido');
    }
  };

  const handleWhatsapp = () => {
    setShowWhatsAppModal(true);
  };

  const handleEmail = () => {
    setShowEmailModal(true);
  };

  const handleCompletarPago = () => {
    setShowCompletarPagoModal(true);
  };

  const handlePagoCompletado = () => {
    // La factura se actualizará desde el servidor cuando se recargue la lista
    onChange && onChange();
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 relative hover:shadow-xl transition-all duration-300">
        {/* Header de la factura */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {factura.cliente?.nombre?.charAt(0)?.toUpperCase() || 'F'}
              </span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {factura.cliente?.nombre || 'Cliente'}
              </h3>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                factura.estado === 'activo' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                factura.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                factura.estado === 'borrador' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
              }`}>
                {getEstadoIcon(factura.estado)} {getEstadoTexto(factura.estado)}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleEditar}
              className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors"
              title="Editar factura"
              disabled={!idValido}
            >
              <PencilIcon className="h-5 w-5" />
            </button>
            {factura.estado === 'pagada' && (
              <button 
                onClick={handleDeshacerPagada} 
                className="p-2 text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-xl transition-colors"
                title="Deshacer estado pagado"
                disabled={!idValido}
              >
                <ArrowUturnLeftIcon className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={handleEliminar}
              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
              title="Eliminar factura"
              disabled={!idValido}
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Información de la factura organizada */}
        <div className="space-y-6 mb-6">
          {/* Información principal */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Información de Factura
              </h4>
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full">
                #{factura.numero_factura || 'N/A'}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <FiDollarSign className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                  <p className="font-bold text-gray-900 dark:text-gray-100 text-lg">
                    ${factura.total?.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>
              
              {factura.estado === 'pendiente' && factura.balance_restante && factura.balance_restante > 0 && (
                <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                  <FiDollarSign className="h-5 w-5 text-yellow-500" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Balance Pendiente</p>
                    <p className="font-bold text-yellow-700 dark:text-yellow-300">
                      ${factura.balance_restante?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <button
                    onClick={handleCompletarPago}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium text-sm transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
                    title="Completar Pago"
                  >
                    <FiDollarSign className="h-4 w-4" />
                    Completar Pago
                  </button>
                </div>
              )}

              {factura.estado === 'pagada' && (
                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                  <FiDollarSign className="h-5 w-5 text-green-500" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Estado</p>
                    <p className="font-bold text-green-700 dark:text-green-300">
                      Pagada
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Información adicional */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Detalles
            </h4>
            <div className="space-y-2">
              {/* Fechas en una fila */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <FiCalendar className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Fecha de Creación</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {factura.fecha_factura || 'Sin fecha'}
                    </p>
                  </div>
                </div>
                
                {factura.fecha_vencimiento && (
                  <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
                    <FiCalendar className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Fecha de Vencimiento</p>
                      <p className="font-medium text-orange-700 dark:text-orange-300">
                        {factura.fecha_vencimiento}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <FiUser className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Cliente</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {factura.cliente?.nombre || 'Sin nombre'}
                  </p>
                </div>
              </div>
              
              {factura.estado === 'pagada' && factura.metodo_pago && (
                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                  <FiDollarSign className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Método de Pago</p>
                    <p className="font-medium text-green-700 dark:text-green-300">
                      {factura.metodo_pago.nombre}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Acciones de documento */}
        <div className="flex gap-3 mb-6">
          {idValido && (
            <a 
              href={pdfUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex-1 flex items-center justify-center gap-3 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors font-medium"
              title="Ver PDF"
            >
              <span className="text-2xl">📄</span>
              Ver PDF
            </a>
          )}
          <button 
            onClick={() => {
              if (idValido) {
                navigator.clipboard.writeText(pdfUrl); 
                toast.success('Link público copiado');
              } else {
                toast.error('No hay PDF público disponible');
              }
            }} 
            className="flex-1 flex items-center justify-center gap-3 py-3 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors font-medium"
            title="Copiar link PDF"
            disabled={!idValido}
          >
            <LinkIcon className="h-5 w-5" />
            Copiar Link
          </button>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-3">
          <button
            onClick={handleLlamar}
            className="flex-1 flex items-center justify-center gap-3 py-3 text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-400 rounded-xl transition-colors font-medium"
            title="Llamar al cliente"
          >
            <PhoneIcon className="h-5 w-5" />
            Llamar
          </button>
          <button
            onClick={handleWhatsapp}
            className="flex-1 flex items-center justify-center gap-3 py-3 text-green-600 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-400 rounded-xl transition-colors font-medium"
            title="Enviar WhatsApp"
          >
            <ChatBubbleLeftIcon className="h-5 w-5" />
            WhatsApp
          </button>
          <button
            onClick={handleEmail}
            className="flex-1 flex items-center justify-center gap-3 py-3 text-purple-600 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 dark:text-purple-400 rounded-xl transition-colors font-medium"
            title="Enviar Email"
          >
            <span className="text-lg">📧</span>
            Email
          </button>
        </div>
      </div>

      {/* Modal de Completar Pago */}
      <CompletarPagoModal
        open={showCompletarPagoModal}
        onClose={() => setShowCompletarPagoModal(false)}
        factura={factura}
        onPagoCompletado={handlePagoCompletado}
      />

      {/* Modal de WhatsApp */}
      {showWhatsAppModal && factura && (
        <WhatsAppFacturaModal
          open={showWhatsAppModal}
          onClose={() => setShowWhatsAppModal(false)}
          factura={factura}
        />
      )}

      {/* Modal de Email */}
      {showEmailModal && factura && (
        <EmailFacturaModal
          open={showEmailModal}
          onClose={() => setShowEmailModal(false)}
          factura={factura}
        />
      )}
    </>
  );
} 