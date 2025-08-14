import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { FiTrash2 } from 'react-icons/fi';
import { FiAlertTriangle } from 'react-icons/fi';
import MetodosPagoModal from './MetodosPagoModal';

interface Mensaje {
  id: string;
  texto: string;
}

interface MetodoPago {
  id: string;
  nombre: string;
  link?: string;
  descripcion?: string;
  activo: boolean;
  orden: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  cliente: { nombre: string; telefono: string } | null;
  factura?: any; // Añadir factura como prop opcional
}

export default function MensajeWhatsappModal({ open, onClose, cliente, factura }: Props) {
  const [mensaje, setMensaje] = useState('');
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [loading, setLoading] = useState(false);
  const [negocioConfig, setNegocioConfig] = useState<{ telefono: string } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showMetodosPago, setShowMetodosPago] = useState(false);
  const [metodoSeleccionado, setMetodoSeleccionado] = useState<MetodoPago | null>(null);

  useEffect(() => {
    // Detectar si es dispositivo móvil
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));

    if (open) {
      setMensaje('');
      setMetodoSeleccionado(null);
      fetchMensajes();
      fetchNegocioConfig();
    }
  }, [open]);

  const fetchNegocioConfig = async () => {
    try {
      const res = await api.get('/api/negocio-config');
      setNegocioConfig(res.data);
    } catch {
      setNegocioConfig(null);
    }
  };

  const fetchMensajes = async () => {
    try {
      const res = await api.get('/api/mensajes');
      setMensajes(res.data);
    } catch {
      setMensajes([]);
    }
  };

  const validarTelefono = (telefono: string) => {
    return /^\d{10}$/.test(telefono);
  };

  // Generar mensaje automático basado en el estado de la factura
  const generarMensajeAutomatico = (factura: any, metodo?: MetodoPago | null) => {
    const linkPublico = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/factura/${factura.id}`;
    
    if (factura.estado === 'pendiente') {
      let mensaje = `Hola ${factura.cliente?.nombre}, aquí tienes tu factura pendiente:\n\n`;
      mensaje += `📄 Factura #${factura.numero_factura}\n`;
      mensaje += `💰 Total: $${factura.total?.toFixed(2)}\n`;
      mensaje += `⚖️ Balance Pendiente: $${factura.balance_restante?.toFixed(2)}\n\n`;
      mensaje += `🔗 Ver factura: ${linkPublico}\n\n`;
      
      if (metodo) {
        mensaje += `💳 Método de Pago: ${metodo.nombre}\n`;
        if (metodo.link) {
          mensaje += `🔗 Pagar aquí: ${metodo.link}\n\n`;
        }
        if (metodo.descripcion) {
          mensaje += `📝 Instrucciones:\n${metodo.descripcion}\n\n`;
        }
      }
      
      mensaje += `Gracias por tu preferencia.`;
      return mensaje;
    } else if (factura.estado === 'pagada') {
      let mensaje = `Hola ${factura.cliente?.nombre}, ¡gracias por tu pago!\n\n`;
      mensaje += `✅ Factura #${factura.numero_factura} - PAGADA\n`;
      mensaje += `💰 Total pagado: $${factura.total?.toFixed(2)}\n`;
      mensaje += `📅 Fecha de pago: ${new Date(factura.fecha_pago).toLocaleDateString()}\n\n`;
      mensaje += `🔗 Ver factura completa: ${linkPublico}\n\n`;
      mensaje += `¡Esperamos verte pronto!`;
      return mensaje;
    }
    
    return '';
  };

  const handleEnviar = () => {
    if (!mensaje.trim()) {
      toast.error('Escribe o selecciona un mensaje');
      return;
    }

    if (!negocioConfig?.telefono || !validarTelefono(negocioConfig.telefono)) {
      toast.error('El número de teléfono del negocio no es válido. Verifica la configuración.');
      return;
    }

    // Si hay factura pendiente y no se ha seleccionado método de pago, mostrar modal
    if (factura && factura.estado === 'pendiente' && !metodoSeleccionado) {
      setShowMetodosPago(true);
      return;
    }

    const texto = encodeURIComponent(mensaje.replace('{cliente}', cliente?.nombre || ''));
    window.open(`https://wa.me/${cliente?.telefono}?text=${texto}`, '_blank');
    onClose();
  };

  const handleMetodoSeleccionado = (metodo: MetodoPago) => {
    setMetodoSeleccionado(metodo);
    // Generar mensaje automático con el método seleccionado
    if (factura) {
      const mensajeAutomatico = generarMensajeAutomatico(factura, metodo);
      setMensaje(mensajeAutomatico);
    }
  };

  const handleGuardar = async () => {
    if (!mensaje.trim()) return;
    setLoading(true);
    try {
      await api.post('/api/mensajes', { texto: mensaje });
      toast.success('Mensaje guardado');
      setMensaje('');
      fetchMensajes();
    } catch {
      toast.error('Error al guardar el mensaje');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id: string) => {
    if (!window.confirm('¿Eliminar este mensaje?')) return;
    setLoading(true);
    try {
      await api.delete(`/api/mensajes/${id}`);
      toast.success('Mensaje eliminado');
      fetchMensajes();
    } catch {
      toast.error('Error al eliminar el mensaje');
    } finally {
      setLoading(false);
    }
  };

  // Generar mensaje automático al abrir si hay factura
  useEffect(() => {
    if (open && factura && !mensaje) {
      const mensajeAutomatico = generarMensajeAutomatico(factura, metodoSeleccionado);
      if (mensajeAutomatico) {
        setMensaje(mensajeAutomatico);
      }
    }
  }, [open, factura, metodoSeleccionado]);

  if (!open || !cliente) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
        <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-xs">
          <h2 className="text-xl font-bold mb-4 text-center">Enviar WhatsApp</h2>

          {/* Información de la factura si existe */}
          {factura && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-700">
                <p><strong>Factura #{factura.numero_factura}</strong></p>
                <p>Estado: <span className={factura.estado === 'pendiente' ? 'text-yellow-600 font-bold' : 'text-green-600 font-bold'}>{factura.estado}</span></p>
                <p>Total: ${factura.total?.toFixed(2)}</p>
                {factura.estado === 'pendiente' && (
                  <p>Balance: ${factura.balance_restante?.toFixed(2)}</p>
                )}
              </div>
            </div>
          )}

          {(!negocioConfig?.telefono || !validarTelefono(negocioConfig.telefono)) && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-700 mb-1">
                <FiAlertTriangle className="h-5 w-5" />
                <span className="font-semibold">Atención</span>
              </div>
              <p className="text-sm text-yellow-600">
                El número de teléfono del negocio no es válido. Por favor, verifica la configuración antes de enviar mensajes.
              </p>
            </div>
          )}

          {!isMobile ? (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-600">
                Asegúrate de tener abierto WhatsApp Web con el número del negocio antes de enviar mensajes.
              </p>
            </div>
          ) : (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-600">
                Al enviar el mensaje se abrirá la aplicación de WhatsApp con el mensaje predefinido.
              </p>
            </div>
          )}

          <div className="mb-2">
            <textarea
              className="w-full px-3 py-2 border rounded focus:outline-none"
              placeholder="Escribe o selecciona un mensaje..."
              value={mensaje}
              onChange={e => setMensaje(e.target.value)}
              rows={6}
            />
            <button
              className="mt-2 w-full py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
              onClick={handleGuardar}
              disabled={loading}
            >
              Guardar como predefinido
            </button>
          </div>
          <div className="mb-4">
            <div className="text-xs text-gray-500 mb-1">Mensajes predefinidos:</div>
            <div className="space-y-1">
              {mensajes.map((m) => (
                <div key={m.id} className="flex items-center gap-2">
                  <button
                    className={`flex-1 text-left px-2 py-1 rounded ${mensaje === m.texto ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                    onClick={() => setMensaje(m.texto)}
                  >
                    {m.texto}
                  </button>
                  <button
                    className="text-red-500 hover:text-red-700"
                    onClick={() => handleEliminar(m.id)}
                    disabled={loading}
                  >
                    <FiTrash2 />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              className="flex-1 py-2 rounded bg-gray-200 text-gray-700 font-semibold"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              className="flex-1 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700 transition"
              onClick={handleEnviar}
              disabled={loading || !negocioConfig?.telefono || !validarTelefono(negocioConfig.telefono)}
            >
              Enviar
            </button>
          </div>
        </div>
      </div>

      {/* Modal de métodos de pago */}
      {showMetodosPago && factura && (
        <MetodosPagoModal
          open={showMetodosPago}
          onClose={() => setShowMetodosPago(false)}
          factura={factura}
          onMetodoSeleccionado={handleMetodoSeleccionado}
          tipoMensaje="whatsapp"
        />
      )}
    </>
  );
} 