import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { FiEdit, FiCheck, FiX, FiMessageCircle, FiSmartphone, FiSettings } from 'react-icons/fi';
import MetodosPagoModal from './MetodosPagoModal';
import { buildPublicFacturaUrl } from '../utils/urls';
import { openWhatsApp } from '../utils/urls';
import GestionMensajesPredefinidosModal from './GestionMensajesPredefinidosModal';
import { 
  obtenerMensajePredefinido, 
  generarMensajeConDatosActuales,
  TipoMensaje
} from '../utils/mensajeHelpers';

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
  factura: any;
}

export default function WhatsAppFacturaModal({ open, onClose, factura }: Props) {
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);
  const [negocioConfig, setNegocioConfig] = useState<{ telefono: string } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showMetodosPago, setShowMetodosPago] = useState(false);
  const [metodoSeleccionado, setMetodoSeleccionado] = useState<MetodoPago | null>(null);
  const [showEditCliente, setShowEditCliente] = useState(false);
  const [showGestionMensajes, setShowGestionMensajes] = useState(false);
  const [clienteEditado, setClienteEditado] = useState({
    nombre: factura?.cliente?.nombre || '',
    telefono: factura?.cliente?.telefono || '',
    email: factura?.cliente?.email || ''
  });

  useEffect(() => {
    // Detectar si es dispositivo móvil
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));

    if (open) {
      setMetodoSeleccionado(null);
      setClienteEditado({
        nombre: factura?.cliente?.nombre || '',
        telefono: factura?.cliente?.telefono || '',
        email: factura?.cliente?.email || ''
      });
      fetchNegocioConfig();
      
      // Cargar mensaje predefinido al abrir el modal
      if (factura) {
        cargarMensajePredefinido();
      }
    }
  }, [open, factura]);

  // Función para cargar mensaje predefinido
  const cargarMensajePredefinido = async () => {
    try {
      const tipo: TipoMensaje = factura.estado === 'pagada' ? 'pagada' : 'pendiente';
      const mensajePredefinido = await obtenerMensajePredefinido(tipo, 'whatsapp');
      
      if (mensajePredefinido) {
        const linkFactura = buildPublicFacturaUrl(factura.id, factura);
        // Si ya hay un método seleccionado, usar su link o descripción, sino usar un placeholder
        const linkPago = metodoSeleccionado?.link;
        const descripcionPago = metodoSeleccionado?.descripcion;
        const mensajeGenerado = generarMensajeConDatosActuales(mensajePredefinido, factura, linkFactura, linkPago, descripcionPago);
        setMensaje(mensajeGenerado);
      } else {
        // Fallback al mensaje automático si no hay predefinido
        const mensajeAutomatico = generarMensajeAutomatico(factura, metodoSeleccionado || undefined);
        setMensaje(mensajeAutomatico);
      }
    } catch (error) {
      console.error('Error cargando mensaje predefinido:', error);
      // Fallback al mensaje automático
      const mensajeAutomatico = generarMensajeAutomatico(factura, metodoSeleccionado || undefined);
      setMensaje(mensajeAutomatico);
    }
  };

  const fetchNegocioConfig = async () => {
    try {
      const res = await api.get('/api/negocio-config');
      setNegocioConfig(res.data);
    } catch {
      setNegocioConfig(null);
    }
  };

  const validarTelefono = (telefono: string) => {
    return /^\d{10}$/.test(telefono);
  };

  // Generar mensaje automático basado en el estado de la factura
  const generarMensajeAutomatico = (factura: any, metodo?: MetodoPago) => {
    // Usar la URL con formato legible
    const linkPublico = buildPublicFacturaUrl(factura.id, factura);
    
    if (factura.estado === 'pendiente') {
      let mensaje = `Estimado/a cliente,\n\n`;
      mensaje += `Adjunto encontrará su factura pendiente de pago:\n\n`;
      mensaje += `📄 Factura #${factura.numero_factura}\n`;
      mensaje += `💰 Monto Total: $${factura.total?.toFixed(2)}\n`;
      mensaje += `⚖️ Saldo Pendiente: $${factura.balance_restante?.toFixed(2)}\n\n`;
      mensaje += `🔗 Acceso a la factura: ${linkPublico}\n\n`;
      
      if (metodo) {
        mensaje += `Para realizar el pago del saldo pendiente, utilice el siguiente enlace:\n`;
        if (metodo.link) {
          mensaje += `🔗 ${metodo.link}\n\n`;
        }
        if (metodo.descripcion) {
          mensaje += `📝 Instrucciones: ${metodo.descripcion}\n\n`;
        }
      }
      
      mensaje += `Agradecemos su preferencia.\n`;
      mensaje += `Saludos cordiales.`;
      return mensaje;
    } else if (factura.estado === 'pagada') {
      let mensaje = `Estimado/a cliente,\n\n`;
      mensaje += `Le confirmamos que hemos recibido su pago exitosamente.\n\n`;
      mensaje += `✅ Factura #${factura.numero_factura} - PAGADA\n`;
      mensaje += `💰 Monto Pagado: $${factura.total?.toFixed(2)}\n`;
      if (factura.fecha_pago) {
        mensaje += `📅 Fecha de Pago: ${new Date(factura.fecha_pago).toLocaleDateString()}\n`;
      }
      mensaje += `\n🔗 Factura PDF actualizada: ${linkPublico}\n\n`;
      mensaje += `Agradecemos su confianza en nuestros servicios.\n`;
      mensaje += `Esperamos poder atenderle nuevamente en el futuro.\n\n`;
      mensaje += `Saludos cordiales.`;
      return mensaje;
    }
    
    return '';
  };

  const handleMetodoSeleccionado = (metodo: MetodoPago) => {
    setMetodoSeleccionado(metodo);
    setShowMetodosPago(false);
    
    // Actualizar mensaje con el método seleccionado
    actualizarMensajeConMetodo(metodo);
  };

  const actualizarMensajeConMetodo = async (metodo: MetodoPago) => {
    try {
      const tipo: TipoMensaje = factura.estado === 'pagada' ? 'pagada' : 'pendiente';
      const mensajePredefinido = await obtenerMensajePredefinido(tipo, 'whatsapp');
      
      if (mensajePredefinido) {
        const linkFactura = buildPublicFacturaUrl(factura.id, factura);
        const linkPago = metodo.link;
        const descripcionPago = metodo.descripcion;
        const mensajeGenerado = generarMensajeConDatosActuales(mensajePredefinido, factura, linkFactura, linkPago, descripcionPago);
        setMensaje(mensajeGenerado);
      } else {
        // Fallback al mensaje automático con método
        const mensajeAutomatico = generarMensajeAutomatico(factura, metodo);
        setMensaje(mensajeAutomatico);
      }
    } catch (error) {
      console.error('Error actualizando mensaje con método:', error);
      const mensajeAutomatico = generarMensajeAutomatico(factura, metodo);
      setMensaje(mensajeAutomatico);
    }
  };

  const handleEnviar = () => {
    // Si hay factura pendiente y no se ha seleccionado método de pago, mostrar modal
    if (factura && factura.estado === 'pendiente' && !metodoSeleccionado) {
      setShowMetodosPago(true);
      return;
    }

    // Validaciones para envío real
    if (!clienteEditado.telefono || !validarTelefono(clienteEditado.telefono)) {
      toast.error('El número de teléfono del cliente no es válido');
      return;
    }

    if (!mensaje.trim()) {
      toast.error('El mensaje no puede estar vacío');
      return;
    }

    setLoading(true);

    // Usar la función utilitaria para abrir WhatsApp
    const success = openWhatsApp(clienteEditado.telefono, mensaje);
    
    if (success) {
      toast.success('WhatsApp abierto con el mensaje');
    } else {
      // Fallback: copiar al portapapeles y mostrar instrucciones
      navigator.clipboard.writeText(mensaje).then(() => {
        toast.success('Mensaje copiado al portapapeles. Abre WhatsApp manualmente.');
      }).catch(() => {
        toast.error('Error al abrir WhatsApp. Intenta manualmente.');
      });
    }
    
    setLoading(false);
    onClose();
  };

  const handleGuardarCliente = () => {
    if (!clienteEditado.nombre.trim()) {
      toast.error('El nombre del cliente es obligatorio');
      return;
    }

    if (!clienteEditado.telefono || !validarTelefono(clienteEditado.telefono)) {
      toast.error('El número de teléfono debe tener 10 dígitos');
      return;
    }

    // Aquí iría la lógica para actualizar el cliente en la base de datos
    toast.success('Cliente actualizado');
    setShowEditCliente(false);
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-1 sm:px-2 pt-2 sm:pt-4 pb-16 sm:pb-20 text-center sm:block sm:p-0 sm:px-4">
          <div className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75" onClick={onClose}></div>

          <div className="relative inline-block w-full max-w-3xl p-3 sm:p-4 my-4 sm:my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-2xl rounded-3xl sm:p-6 flex flex-col max-h-[92vh] sm:max-h-[95vh] md:max-h-[98vh]">
            {/* Header moderno */}
            <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-6 flex-shrink-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <FiMessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
                    Enviar WhatsApp
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    Envía la factura por WhatsApp al cliente
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
            <div className="overflow-y-auto flex-1 min-h-0 space-y-3 sm:space-y-4">
              {/* Información de la factura */}
              <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm sm:text-base">
                    Factura #{factura?.numero_factura}
                  </h4>
                  <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                    factura?.estado === 'pendiente' 
                      ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                      : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  }`}>
                    {factura?.estado}
                  </span>
                </div>
                <div className="space-y-1 text-xs sm:text-sm text-blue-800 dark:text-blue-200">
                  <p><strong>Total:</strong> ${factura?.total?.toFixed(2)}</p>
                  <p><strong>{factura?.estado === 'pagada' ? 'Balance' : 'Saldo'}:</strong> ${
                    factura?.estado === 'pagada' ? '0.00' : factura?.balance_restante?.toFixed(2)
                  }</p>
                </div>
              </div>

              {/* Información del cliente */}
              <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base">Cliente</h4>
                  <button
                    onClick={() => setShowEditCliente(!showEditCliente)}
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 text-xs sm:text-sm bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    <FiEdit className="h-3 w-3" />
                    Editar
                  </button>
                </div>
                
                {!showEditCliente ? (
                  <div className="space-y-1 sm:space-y-2">
                    <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                      <strong>Nombre:</strong> {clienteEditado.nombre}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                        <strong>Teléfono:</strong> {clienteEditado.telefono}
                      </p>
                      {validarTelefono(clienteEditado.telefono) && (
                        <FiCheck className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nombre
                      </label>
                      <input
                        type="text"
                        value={clienteEditado.nombre}
                        onChange={(e) => setClienteEditado({ ...clienteEditado, nombre: e.target.value })}
                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        value={clienteEditado.telefono}
                        onChange={(e) => setClienteEditado({ ...clienteEditado, telefono: e.target.value })}
                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="9392283101"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleGuardarCliente}
                        className="flex-1 px-2 sm:px-3 py-1 sm:py-1 bg-blue-600 text-white rounded text-xs sm:text-sm hover:bg-blue-700 transition-colors"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => setShowEditCliente(false)}
                        className="flex-1 px-2 sm:px-3 py-1 sm:py-1 bg-gray-300 text-gray-700 rounded text-xs sm:text-sm hover:bg-gray-400 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Información del método de pago seleccionado */}
              {metodoSeleccionado && (
                <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-2xl">
                  <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2 text-sm sm:text-base">
                    Método de Pago Seleccionado:
                  </h4>
                  <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-green-800 dark:text-green-200">
                    <p className="font-semibold">{metodoSeleccionado.nombre}</p>
                    {metodoSeleccionado.link && (
                      <p>
                        <strong>Link:</strong> 
                        <a href={metodoSeleccionado.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                          {metodoSeleccionado.link}
                        </a>
                      </p>
                    )}
                    {metodoSeleccionado.descripcion && (
                      <p><strong>Instrucciones:</strong> {metodoSeleccionado.descripcion}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Advertencias */}
              {(!negocioConfig?.telefono || !validarTelefono(negocioConfig.telefono)) && (
                <div className="p-3 sm:p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-2xl">
                  <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300 mb-1">
                    <span className="font-semibold text-sm">⚠️ Atención</span>
                  </div>
                  <p className="text-xs sm:text-sm text-yellow-600 dark:text-yellow-400">
                    El número de teléfono del negocio no es válido. Por favor, verifica la configuración antes de enviar mensajes.
                  </p>
                </div>
              )}

              <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-2xl">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 mb-1">
                  <FiSmartphone className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="font-semibold text-sm">Información</span>
                </div>
                <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400">
                  {isMobile 
                    ? 'Al enviar el mensaje se abrirá la aplicación de WhatsApp con el mensaje predefinido.'
                    : 'Asegúrate de tener abierto WhatsApp Web con el número del negocio antes de enviar mensajes.'
                  }
                </p>
              </div>

              {/* Mensaje */}
              <div>
                {factura.estado === 'pendiente' && !metodoSeleccionado ? (
                  <div className="p-3 sm:p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-2xl">
                    <p className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-300">
                      ⚠️ Para facturas pendientes, primero debes seleccionar un método de pago haciendo clic en "Seleccionar Método de Pago".
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Mensaje
                      </label>
                      <button
                        onClick={() => setShowGestionMensajes(true)}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors"
                      >
                        <FiSettings className="h-3 w-3" />
                        Gestionar
                      </button>
                    </div>
                    <textarea
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none transition-colors resize-none text-sm"
                      placeholder="Escribe o selecciona un mensaje..."
                      value={mensaje}
                      onChange={e => setMensaje(e.target.value)}
                      rows={8}
                    />
                  </>
                )}
              </div>
            </div>

            {/* Botones fijos en la parte inferior */}
            <div className="bg-white dark:bg-gray-800 pt-2 sm:pt-3 mt-3 sm:mt-4 border-t border-gray-200 dark:border-gray-600 flex-shrink-0">
              <div className="flex gap-2 sm:gap-3">
                <button
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-xs sm:text-sm md:text-base"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50 text-xs sm:text-sm md:text-base"
                  onClick={handleEnviar}
                  disabled={loading}
                >
                  {factura.estado === 'pendiente' && !metodoSeleccionado ? 'Seleccionar Método de Pago' : 'Enviar'}
                </button>
              </div>
            </div>
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

      {/* Modal de gestión de mensajes predefinidos */}
      {showGestionMensajes && factura && (
        <GestionMensajesPredefinidosModal
          isOpen={showGestionMensajes}
          onClose={() => setShowGestionMensajes(false)}
          factura={factura}
          tipo={factura.estado === 'pagada' ? 'pagada' : 'pendiente'}
          canal="whatsapp"
          metodoSeleccionado={metodoSeleccionado}
          onMensajeActualizado={(mensajeActualizado) => {
            setMensaje(mensajeActualizado);
            setShowGestionMensajes(false);
          }}
        />
      )}
    </>
  );
}
