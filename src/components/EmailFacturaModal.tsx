import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { FiEdit, FiCheck, FiX, FiMail, FiSmartphone, FiSettings } from 'react-icons/fi';
import MetodosPagoModal from './MetodosPagoModal';
import { buildPublicFacturaUrl } from '../utils/urls';
import GestionMensajesPredefinidosFacturaModal from './GestionMensajesPredefinidosFacturaModal';
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
  color_personalizado?: string;
}

export default function EmailFacturaModal({ open, onClose, factura, color_personalizado = '#2563eb' }: Props) {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [loading, setLoading] = useState(false);
  const [showMetodosPago, setShowMetodosPago] = useState(false);
  const [metodoSeleccionado, setMetodoSeleccionado] = useState<MetodoPago | null>(null);
  const [showEditCliente, setShowEditCliente] = useState(false);
  const [showGestionMensajes, setShowGestionMensajes] = useState(false);
  const [tipoMensajeSeleccionado, setTipoMensajeSeleccionado] = useState<'pendiente' | 'vencida' | 'por_vencer' | null>(null);
  const [clienteEditado, setClienteEditado] = useState({
    nombre: factura?.cliente?.nombre || '',
    telefono: factura?.cliente?.telefono || '',
    email: factura?.cliente?.email || ''
  });

  useEffect(() => {
    if (open) {
      setMetodoSeleccionado(null);
      setClienteEditado({
        nombre: factura?.cliente?.nombre || '',
        telefono: factura?.cliente?.telefono || '',
        email: factura?.cliente?.email || ''
      });
      
             // Cargar mensaje predefinido al abrir el modal solo si no hay mensaje
       if (factura) {
         cargarMensajePredefinido(true); // Forzar carga solo la primera vez
       }
    }
  }, [open, factura]);

  // Función para determinar el estado real de la factura
  const determinarEstadoFactura = (factura: any) => {
    if (factura.estado === 'pagada') return 'pagada';
    
    // Si la factura tiene fecha de vencimiento
    if (factura.fecha_vencimiento) {
      const fechaVencimiento = new Date(factura.fecha_vencimiento);
      const hoy = new Date();
      const diasParaVencer = Math.ceil((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diasParaVencer < 0) {
        return 'vencida'; // Ya venció
      } else if (diasParaVencer <= 7) {
        return 'por_vencer'; // Por vencer (7 días o menos)
      }
    }
    
    return 'pendiente'; // Pendiente normal
  };

  // Función para cargar mensaje predefinido
  const cargarMensajePredefinido = async (forzarCarga = false) => {
    // Solo cargar si no hay mensaje o si se fuerza la carga
    if (!forzarCarga && (titulo.trim() || descripcion.trim())) {
      return;
    }

    try {
      const estadoReal = determinarEstadoFactura(factura);
      const tipo: TipoMensaje = estadoReal === 'pagada' ? 'pagada' : (tipoMensajeSeleccionado || estadoReal);
      const mensajePredefinido = await obtenerMensajePredefinido(tipo, 'email');
      
      if (mensajePredefinido) {
        const linkFactura = buildPublicFacturaUrl(factura.id, factura);
        // Si ya hay un método seleccionado, usar su link o descripción, sino usar un placeholder
        const linkPago = metodoSeleccionado?.link;
        const descripcionPago = metodoSeleccionado?.descripcion;
        const mensajeGenerado = generarMensajeConDatosActuales(mensajePredefinido, factura, linkFactura, linkPago, descripcionPago);
        
        // Separar título y descripción del mensaje
        const lineas = mensajeGenerado.split('\n');
        const titulo = lineas[0] || `Factura #${factura.numero_factura}`;
        const descripcion = lineas.slice(1).join('\n');
        
        setTitulo(titulo);
        setDescripcion(descripcion);
      } else {
        // Fallback al mensaje automático si no hay predefinido
        const mensajeAutomatico = generarMensajeAutomatico(factura, metodoSeleccionado || undefined);
        setTitulo(mensajeAutomatico.titulo);
        setDescripcion(mensajeAutomatico.descripcion);
      }
    } catch (error) {
      console.error('Error cargando mensaje predefinido:', error);
      // Fallback al mensaje automático
      const mensajeAutomatico = generarMensajeAutomatico(factura, metodoSeleccionado || undefined);
      setTitulo(mensajeAutomatico.titulo);
      setDescripcion(mensajeAutomatico.descripcion);
    }
  };

  const validarEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Generar mensaje automático basado en el estado de la factura
  const generarMensajeAutomatico = (factura: any, metodo?: MetodoPago) => {
    // Usar la URL con formato legible
    const linkPublico = buildPublicFacturaUrl(factura.id, factura);
    
    if (factura.estado === 'pendiente') {
      let titulo = `Factura #${factura.numero_factura} - Pendiente de Pago`;
      let descripcion = `Estimado/a cliente,\n\n`;
      descripcion += `Adjunto encontrará su factura pendiente de pago:\n\n`;
      descripcion += `📄 Factura #${factura.numero_factura}\n`;
      descripcion += `💰 Monto Total: $${factura.total?.toFixed(2)}\n`;
      descripcion += `⚖️ Saldo Pendiente: $${factura.balance_restante?.toFixed(2)}\n\n`;
      descripcion += `🔗 Acceso a la factura: ${linkPublico}\n\n`;
      
      if (metodo) {
        descripcion += `Para realizar el pago del saldo pendiente, utilice el siguiente enlace:\n`;
        if (metodo.link) {
          descripcion += `🔗 ${metodo.link}\n\n`;
        }
        if (metodo.descripcion) {
          descripcion += `📝 Instrucciones: ${metodo.descripcion}\n\n`;
        }
      }
      
      descripcion += `Agradecemos su preferencia.\n`;
      descripcion += `Saludos cordiales.`;
      return { titulo, descripcion };
    } else if (factura.estado === 'pagada') {
      let titulo = `Factura #${factura.numero_factura} - Pago Confirmado`;
      let descripcion = `Estimado/a cliente,\n\n`;
      descripcion += `Le confirmamos que hemos recibido su pago exitosamente.\n\n`;
      descripcion += `✅ Factura #${factura.numero_factura} - PAGADA\n`;
      descripcion += `💰 Monto Pagado: $${factura.total?.toFixed(2)}\n`;
      if (factura.fecha_pago) {
        descripcion += `📅 Fecha de Pago: ${new Date(factura.fecha_pago).toLocaleDateString()}\n`;
      }
      descripcion += `\n🔗 Factura PDF actualizada: ${linkPublico}\n\n`;
      descripcion += `Agradecemos su confianza en nuestros servicios.\n`;
      descripcion += `Esperamos poder atenderle nuevamente en el futuro.\n\n`;
      descripcion += `Saludos cordiales.`;
      return { titulo, descripcion };
    }
    
    return { titulo: '', descripcion: '' };
  };

  const handleMetodoSeleccionado = (metodo: MetodoPago) => {
    setMetodoSeleccionado(metodo);
    setShowMetodosPago(false);
    
    // Actualizar mensaje con el método seleccionado
    actualizarMensajeConMetodo(metodo);
  };

  const actualizarMensajeConMetodo = async (metodo: MetodoPago) => {
    try {
      const estadoReal = determinarEstadoFactura(factura);
      const tipo: TipoMensaje = estadoReal === 'pagada' ? 'pagada' : (tipoMensajeSeleccionado || estadoReal);
      const mensajePredefinido = await obtenerMensajePredefinido(tipo, 'email');
      
      if (mensajePredefinido) {
        const linkFactura = buildPublicFacturaUrl(factura.id, factura);
        const linkPago = metodo.link;
        const descripcionPago = metodo.descripcion;
        const mensajeGenerado = generarMensajeConDatosActuales(mensajePredefinido, factura, linkFactura, linkPago, descripcionPago);
        
        // Separar título y descripción del mensaje
        const lineas = mensajeGenerado.split('\n');
        const titulo = lineas[0] || `Factura #${factura.numero_factura}`;
        const descripcion = lineas.slice(1).join('\n');
        
        setTitulo(titulo);
        setDescripcion(descripcion);
      } else {
        // Fallback al mensaje automático con método
        const mensajeAutomatico = generarMensajeAutomatico(factura, metodo);
        setTitulo(mensajeAutomatico.titulo);
        setDescripcion(mensajeAutomatico.descripcion);
      }
    } catch (error) {
      console.error('Error actualizando mensaje con método:', error);
      const mensajeAutomatico = generarMensajeAutomatico(factura, metodo);
      setTitulo(mensajeAutomatico.titulo);
      setDescripcion(mensajeAutomatico.descripcion);
    }
  };

  const handleEnviar = () => {
    const estadoReal = determinarEstadoFactura(factura);
    
    // Si la factura está vencida o por vencer, mostrar alerta para seleccionar tipo de mensaje
    if ((estadoReal === 'vencida' || estadoReal === 'por_vencer') && !tipoMensajeSeleccionado) {
      mostrarAlertaSeleccionTipoMensaje(estadoReal);
      return;
    }
    
    // Si hay factura pendiente y no se ha seleccionado método de pago, mostrar modal
    if (factura && factura.estado === 'pendiente' && !metodoSeleccionado) {
      setShowMetodosPago(true);
      return;
    }

    // Validaciones para envío real
    if (!clienteEditado.email || !validarEmail(clienteEditado.email)) {
      toast.error('El email del cliente no es válido');
      return;
    }

    if (!titulo.trim()) {
      toast.error('El título del email es obligatorio');
      return;
    }

    if (!descripcion.trim()) {
      toast.error('El mensaje del email es obligatorio');
      return;
    }

    setLoading(true);

    // Simular envío (en producción esto sería una llamada real a la API)
    setTimeout(() => {
      const asunto = encodeURIComponent(titulo);
      const cuerpo = encodeURIComponent(descripcion);
      const mailtoUrl = `mailto:${clienteEditado.email}?subject=${asunto}&body=${cuerpo}`;
      
      window.open(mailtoUrl, '_blank');
      
      toast.success('Cliente de email abierto');
      setLoading(false);
      onClose();
    }, 1000);
  };

  const mostrarAlertaSeleccionTipoMensaje = async (estadoReal: string) => {
    const titulo = estadoReal === 'vencida' 
      ? 'Factura Vencida - Seleccionar Tipo de Mensaje'
      : 'Factura Por Vencer - Seleccionar Tipo de Mensaje';
    
    const descripcion = estadoReal === 'vencida'
      ? 'Esta factura está vencida. ¿Qué tipo de mensaje deseas enviar?'
      : 'Esta factura está por vencer. ¿Qué tipo de mensaje deseas enviar?';
    
    const result = await Swal.fire({
      title: titulo,
      text: descripcion,
      icon: 'question',
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: estadoReal === 'vencida' ? 'Mensaje de Factura Vencida' : 'Mensaje de Factura Por Vencer',
      denyButtonText: 'Mensaje de Pago Pendiente',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: estadoReal === 'vencida' ? '#dc2626' : '#ea580c', // Rojo para vencida, naranja para por vencer
      denyButtonColor: '#2563eb', // Azul para pendiente
      cancelButtonColor: '#6b7280',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      // Usar el mensaje específico del estado (vencida o por vencer)
      setTipoMensajeSeleccionado(estadoReal as 'vencida' | 'por_vencer');
      setShowMetodosPago(true);
    } else if (result.isDenied) {
      // Usar mensaje de pago pendiente
      setTipoMensajeSeleccionado('pendiente');
      setShowMetodosPago(true);
    }
    // Si es cancelado, no hacer nada
  };

  const handleGuardarCliente = () => {
    if (!clienteEditado.nombre.trim()) {
      toast.error('El nombre del cliente es obligatorio');
      return;
    }

    if (!clienteEditado.email || !validarEmail(clienteEditado.email)) {
      toast.error('El email del cliente no es válido');
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

          <div className="relative mx-auto w-full max-w-3xl p-3 sm:p-4 my-4 sm:my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-2xl rounded-3xl sm:p-6 flex flex-col max-h-[92vh] sm:max-h-[95vh] md:max-h-[98vh]">
            {/* Header moderno */}
            <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-6 flex-shrink-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <FiMail className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
                    Enviar Email
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    Envía la factura por email al cliente
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
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                      factura?.estado === 'pagada' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                    }`}>
                      Pendiente a Pagar
                    </span>
                    {(() => {
                      const estadoReal = determinarEstadoFactura(factura);
                      if (estadoReal === 'vencida') {
                        return (
                          <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                            VENCIDA
                          </span>
                        );
                      } else if (estadoReal === 'por_vencer') {
                        return (
                          <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                            POR VENCER
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>
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
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-lg transition-colors"
                    style={{ backgroundColor: `${color_personalizado}20`, color: color_personalizado }}
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
                        <strong>Email:</strong> {clienteEditado.email}
                      </p>
                      {validarEmail(clienteEditado.email) && (
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
                        Email
                      </label>
                      <input
                        type="email"
                        value={clienteEditado.email}
                        onChange={(e) => setClienteEditado({ ...clienteEditado, email: e.target.value })}
                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="cliente@ejemplo.com"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleGuardarCliente}
                        className="flex-1 px-2 sm:px-3 py-1 sm:py-1 text-white rounded text-xs sm:text-sm transition-colors"
                        style={{ backgroundColor: color_personalizado }}
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

              {/* Información */}
              <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-2xl">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 mb-1">
                  <FiSmartphone className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="font-semibold text-sm">Información</span>
                </div>
                <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400">
                  Al enviar el email se abrirá tu cliente de correo predeterminado con el mensaje predefinido.
                </p>
              </div>

              {/* Campos de email */}
              <div className="space-y-3 sm:space-y-4">
                {factura.estado === 'pendiente' && !metodoSeleccionado ? (
                  <div className="p-3 sm:p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-2xl">
                    <p className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-300">
                      ⚠️ Para facturas pendientes, primero debes seleccionar un método de pago haciendo clic en "Seleccionar Método de Pago".
                    </p>
                  </div>
                ) : (() => {
                  const estadoReal = determinarEstadoFactura(factura);
                  if ((estadoReal === 'vencida' || estadoReal === 'por_vencer') && !tipoMensajeSeleccionado) {
                    return (
                      <div className="p-3 sm:p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-2xl">
                        <p className="text-xs sm:text-sm text-orange-700 dark:text-orange-300">
                          ⚠️ Esta factura está {estadoReal === 'vencida' ? 'vencida' : 'por vencer'}. Haz clic en "Seleccionar Método de Pago" para elegir el tipo de mensaje a enviar.
                        </p>
                      </div>
                    );
                  }
                  return null;
                })() || (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Título del Email
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none transition-colors text-sm"
                        value={titulo}
                        onChange={e => setTitulo(e.target.value)}
                        placeholder="Título del email"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Mensaje
                        </label>
                        <button
                          onClick={() => setShowGestionMensajes(true)}
                          className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg transition-colors"
                        style={{ backgroundColor: `${color_personalizado}20`, color: color_personalizado }}
                        >
                          <FiSettings className="h-3 w-3" />
                          Gestionar
                        </button>
                      </div>
                      <textarea
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none transition-colors resize-none text-sm"
                        value={descripcion}
                        onChange={e => setDescripcion(e.target.value)}
                        rows={8}
                        placeholder="Escribe el mensaje del email"
                      />
                    </div>
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
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-white rounded-xl font-medium transition-colors disabled:opacity-50 text-xs sm:text-sm md:text-base"
                  style={{ backgroundColor: color_personalizado }}
                  onClick={handleEnviar}
                  disabled={loading}
                >
                  {(() => {
                    const estadoReal = determinarEstadoFactura(factura);
                    if (factura.estado === 'pendiente' && !metodoSeleccionado) {
                      return 'Seleccionar Método de Pago';
                    }
                    if ((estadoReal === 'vencida' || estadoReal === 'por_vencer') && !tipoMensajeSeleccionado) {
                      return 'Seleccionar Método de Pago';
                    }
                    return 'Enviar Email';
                  })()}
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
          tipoMensaje="email"
        />
      )}

      {/* Modal de gestión de mensajes predefinidos */}
      {showGestionMensajes && factura && (
        <GestionMensajesPredefinidosFacturaModal
          open={showGestionMensajes}
          onClose={() => setShowGestionMensajes(false)}

          statusInicial={(() => {
            const estadoReal = determinarEstadoFactura(factura);
            return estadoReal === 'pagada' ? 'pagada' : (tipoMensajeSeleccionado || estadoReal);
          })()}
          onMensajeActualizado={(_status, canal, mensajeActualizado) => {
            // Recargar el mensaje en el textarea cuando se actualiza
            if (canal === 'email') {
              const linkFactura = buildPublicFacturaUrl(factura.id, factura);
              const linkPago = metodoSeleccionado?.link;
              const descripcionPago = metodoSeleccionado?.descripcion;
              const mensajeGenerado = generarMensajeConDatosActuales(mensajeActualizado, factura, linkFactura, linkPago, descripcionPago);
              
              // Separar título y descripción del mensaje
              const lineas = mensajeGenerado.split('\n');
              const titulo = lineas[0] || `Factura #${factura.numero_factura}`;
              const descripcion = lineas.slice(1).join('\n');
              
              setTitulo(titulo);
              setDescripcion(descripcion);
            }
          }}
        />
      )}
    </>
  );
}
