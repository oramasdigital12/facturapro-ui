import {
  PencilIcon,
  CheckCircleIcon,
  TrashIcon,
  PhoneIcon,
  ChatBubbleLeftIcon,
  LinkIcon,
  ArrowUturnLeftIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { deleteFactura, updateFactura } from '../services/api';
import { showDeleteConfirmation } from '../utils/alerts';
import Swal from 'sweetalert2';

type FacturaItemProps = {
  factura: any;
};

export default function FacturaItem({ factura, onChange }: FacturaItemProps & { onChange?: () => void }) {
  const navigate = useNavigate();

  // Validación de UUID
  const esUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id);
  const idValido = factura.id && typeof factura.id === 'string' && esUUID(factura.id);
  const pdfUrl = factura.pdfUrl;

  // Handlers de acciones
  const handleEditar = () => {
    if (idValido) {
      navigate(`/facturas/${factura.id}`);
    } else {
      toast.error('ID de factura inválido');
    }
  };
  const handleMarcarPagada = async () => {
    if (!idValido) {
      toast.error('ID de factura inválido');
      return;
    }

    // Si es borrador, preguntar si quiere crear la factura primero
    if (factura.estado === 'borrador') {
      const result = await Swal.fire({
        title: 'Factura en borrador',
        text: 'Esta factura está en borrador. ¿Deseas editarla y guardarla como factura completa primero?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, editar factura',
        cancelButtonText: 'Cancelar'
      });
      if (result.isConfirmed) {
        navigate(`/facturas/${factura.id}`);
        return;
      }
      return;
    }

    // Para facturas que no son borrador, confirmar antes de marcar como pagada
    const result = await Swal.fire({
      title: '¿Marcar como pagada?',
      text: '¿Deseas marcar esta factura como pagada?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, marcar como pagada',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {
      // Mostrar loading inmediato
      toast.loading('Marcando como pagada...', { id: 'marcarPagada' });
      
      await updateFactura(factura.id, { estado: 'pagada' });
      
      // Cerrar loading y mostrar éxito
      toast.dismiss('marcarPagada');
      toast.success('Factura marcada como pagada');
      
      // Actualizar la lista inmediatamente
      onChange && onChange();
    } catch (err: any) {
      toast.dismiss('marcarPagada');
      toast.error(err.message || 'Error al marcar como pagada');
    }
  };
  const handleDeshacerPagada = async () => {
    if (!idValido) {
      toast.error('ID de factura inválido');
      return;
    }

    // Confirmar antes de deshacer el estado pagado
    const result = await Swal.fire({
      title: '¿Deshacer estado pagado?',
      text: '¿Deseas cambiar esta factura de pagada a pendiente?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, deshacer',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {
      // Mostrar loading inmediato
      toast.loading('Deshaciendo estado...', { id: 'deshacerPagada' });
      
      await updateFactura(factura.id, { estado: 'pendiente' });
      
      // Cerrar loading y mostrar éxito
      toast.dismiss('deshacerPagada');
      toast.success('Factura marcada como pendiente');
      
      // Actualizar la lista inmediatamente
      onChange && onChange();
    } catch (err: any) {
      toast.dismiss('deshacerPagada');
      toast.error(err.message || 'Error al deshacer estado');
    }
  };

  const handleEliminar = async () => {
    if (!idValido) {
      toast.error('ID de factura inválido');
      return;
    }
    const result = await showDeleteConfirmation('Esta acción eliminará la factura permanentemente.');
    if (result.isConfirmed) {
      try {
        // Mostrar loading inmediato
        toast.loading('Eliminando factura...', { id: 'eliminarFactura' });
        
        await deleteFactura(factura.id);
        
        // Cerrar loading y mostrar éxito
        toast.dismiss('eliminarFactura');
        toast.success('Factura eliminada');
        
        // Actualizar la lista inmediatamente
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
    const tel = factura.cliente?.telefono?.replace(/[^\d]/g, '');
    if (!pdfUrl) {
      toast.error('No hay PDF público disponible');
      return;
    }
    if (tel) {
      const texto = `Hola, aquí tienes tu factura:\nFactura #${factura.numero_factura || factura.id}\nTotal: $${factura.total?.toFixed(2)}\n${pdfUrl}`;
      const url = `https://wa.me/${tel}?text=${encodeURIComponent(texto)}`;
      window.open(url, '_blank');
    } else {
      toast.error('El cliente no tiene teléfono válido');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-3 flex flex-col gap-2 md:p-4">
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-bold text-gray-800 text-base md:text-lg">{factura.cliente?.nombre || 'Cliente'}</div>
          <div className="text-xs text-gray-500">{factura.fecha_factura || ''}</div>
          <div className="flex gap-2 mt-1 items-center flex-wrap">
            <span className="text-sm font-semibold text-blue-700">${factura.total?.toFixed(2) || '0.00'}</span>
            <span className={`text-xs rounded-full px-2 py-0.5 ${factura.estado === 'pendiente' ? 'text-yellow-600 bg-yellow-100' : factura.estado === 'pagada' ? 'text-green-700 bg-green-100' : 'text-gray-600 bg-gray-100'}`}>{factura.estado}</span>
            <span className="text-xs text-gray-500">Balance: ${factura.balance_restante?.toFixed(2) || '0.00'}</span>
          </div>
        </div>
        {/* Acciones principales arriba derecha y documento/copy debajo */}
        <div className="flex flex-col items-end gap-2 ml-2">
          {/* Acciones principales (editar, marcar pagada/deshacer, eliminar) */}
          <div className="flex space-x-3 md:space-x-2">
            <button title="Editar" onClick={handleEditar} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors" disabled={!idValido}>
              <PencilIcon className="h-6 w-6 md:h-5 md:w-5" />
            </button>
            {factura.estado === 'pagada' ? (
              <button 
                title="Deshacer estado pagado" 
                onClick={handleDeshacerPagada} 
                className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-full transition-colors"
                disabled={!idValido}
              >
                <ArrowUturnLeftIcon className="h-6 w-6 md:h-5 md:w-5" />
              </button>
            ) : (
              <button 
                title={factura.estado === 'borrador' ? 'Completar factura (editar primero)' : 'Marcar como pagada'} 
                onClick={handleMarcarPagada} 
                className={`p-2 rounded-full transition-colors ${
                  factura.estado === 'borrador' 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-green-700 hover:bg-green-50'
                }`} 
                disabled={!idValido || factura.estado === 'borrador'}
              >
                <CheckCircleIcon className="h-6 w-6 md:h-5 md:w-5" />
              </button>
            )}
            <button title="Eliminar" onClick={handleEliminar} className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors" disabled={!idValido}>
              <TrashIcon className="h-6 w-6 md:h-5 md:w-5" />
            </button>
          </div>
          {/* Iconos grandes de documento y copiar link debajo */}
          <div className="flex gap-2 mt-2">
            {idValido && pdfUrl && (
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="p-1 rounded-full hover:bg-gray-100 text-blue-600" title="Ver PDF">
                <span role="img" aria-label="documento" className="text-4xl md:text-5xl">📄</span>
              </a>
            )}
            <button title="Copiar link PDF" onClick={() => {
              if (pdfUrl) {
                navigator.clipboard.writeText(pdfUrl); toast.success('Link público copiado');
              } else {
                toast.error('No hay PDF público disponible');
              }
            }} className="p-2 md:p-3 rounded-full hover:bg-gray-100 text-gray-600" style={{ fontSize: 36 }} disabled={!idValido || !pdfUrl}>
              <LinkIcon className="h-9 w-9 md:h-10 md:w-10" />
            </button>
          </div>
        </div>
      </div>
      {/* Botones de acción secundarios (llamar, WhatsApp) abajo */}
      <div className="flex gap-2 mt-2">
        <button title="Llamar" onClick={handleLlamar} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 text-sm md:text-base">
          <PhoneIcon className="h-5 w-5" /> Llamar
        </button>
        <button title="WhatsApp" onClick={handleWhatsapp} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-green-50 text-green-700 font-semibold hover:bg-green-100 text-sm md:text-base">
          <ChatBubbleLeftIcon className="h-5 w-5" /> Mensaje
        </button>
      </div>
    </div>
  );
} 