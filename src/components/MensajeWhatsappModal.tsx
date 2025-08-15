import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { FiTrash2, FiMessageCircle, FiSmartphone, FiSend, FiSave, FiX, FiAlertTriangle, FiCheck, FiClock, FiDollarSign, FiPlus, FiSearch } from 'react-icons/fi';
import MetodosPagoModal from './MetodosPagoModal';
import { buildPublicFacturaUrl } from '../utils/urls';

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
  const [showCrearModal, setShowCrearModal] = useState(false);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    // Detectar si es dispositivo móvil
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));

    if (open) {
      setMensaje('');
      setMetodoSeleccionado(null);
      setBusqueda('');
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

  // Filtrar mensajes basado en la búsqueda
  const mensajesFiltrados = mensajes.filter(m => 
    m.texto.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Generar mensaje automático basado en el estado de la factura
  const generarMensajeAutomatico = (factura: any, metodo?: MetodoPago | null) => {
    const linkPublico = buildPublicFacturaUrl(factura.id);
    
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
    if (!nuevoMensaje.trim()) return;
    setLoading(true);
    try {
      await api.post('/api/mensajes', { texto: nuevoMensaje });
      toast.success('Mensaje guardado');
      setNuevoMensaje('');
      setShowCrearModal(false);
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
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75" onClick={onClose}></div>

          <div className="relative inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-2xl rounded-3xl flex flex-col max-h-[95vh] sm:max-h-[98vh]">
            {/* Header moderno */}
            <div className="flex items-center justify-between mb-4 sm:mb-6 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <FiMessageCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    Enviar WhatsApp
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Envía mensajes rápidos a {cliente.nombre}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            {/* Contenido principal */}
            <div className="overflow-y-auto flex-1 min-h-0">
              {/* Información del cliente */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-2xl mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                    {cliente.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100">{cliente.nombre}</h4>
                    <p className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      <FiSmartphone className="h-3 w-3" />
                      {cliente.telefono}
                    </p>
                  </div>
                </div>
              </div>

              {/* Información de la factura si existe */}
              {factura && (
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-2xl mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <FiDollarSign className="h-4 w-4 text-purple-500" />
                    <h4 className="font-semibold text-purple-900 dark:text-purple-100">Información de Factura</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-purple-600 dark:text-purple-400">Factura:</span>
                      <p className="font-semibold text-purple-900 dark:text-purple-100">#{factura.numero_factura}</p>
                    </div>
                    <div>
                      <span className="text-purple-600 dark:text-purple-400">Estado:</span>
                      <p className={`font-semibold ${
                        factura.estado === 'pendiente' 
                          ? 'text-yellow-600 dark:text-yellow-400' 
                          : 'text-green-600 dark:text-green-400'
                      }`}>
                        {factura.estado === 'pendiente' ? '⏳ Pendiente' : '✅ Pagada'}
                      </p>
                    </div>
                    <div>
                      <span className="text-purple-600 dark:text-purple-400">Total:</span>
                      <p className="font-semibold text-purple-900 dark:text-purple-100">${factura.total?.toFixed(2)}</p>
                    </div>
                    {factura.estado === 'pendiente' && (
                      <div>
                        <span className="text-purple-600 dark:text-purple-400">Balance:</span>
                        <p className="font-semibold text-purple-900 dark:text-purple-100">${factura.balance_restante?.toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Advertencias */}
              {(!negocioConfig?.telefono || !validarTelefono(negocioConfig.telefono)) && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-2xl mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <FiAlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="font-semibold text-yellow-900 dark:text-yellow-100">Configuración Requerida</span>
                  </div>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    El número de teléfono del negocio no es válido. Verifica la configuración antes de enviar mensajes.
                  </p>
                </div>
              )}

              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-2xl mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <FiSmartphone className="h-4 w-4 text-green-500" />
                  <span className="font-semibold text-green-900 dark:text-green-100">Información</span>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {!isMobile 
                    ? 'Asegúrate de tener abierto WhatsApp Web con el número del negocio antes de enviar mensajes.'
                    : 'Al enviar el mensaje se abrirá la aplicación de WhatsApp con el mensaje predefinido.'
                  }
                </p>
              </div>

              {/* PRIMERO: Mensajes predefinidos */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <FiClock className="h-4 w-4 text-blue-500" />
                    Mensajes Predefinidos
                  </h4>
                  <button
                    onClick={() => setShowCrearModal(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <FiPlus className="h-4 w-4" />
                    Crear
                  </button>
                </div>

                {/* Buscador */}
                {mensajes.length > 0 && (
                  <div className="mb-4">
                    <div className="relative">
                      <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar mensajes..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none transition-colors text-sm"
                      />
                    </div>
                    {busqueda && (
                      <p className="text-xs text-gray-500 mt-2">
                        {mensajesFiltrados.length} de {mensajes.length} mensajes encontrados
                      </p>
                    )}
                  </div>
                )}

                {mensajes.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
                    <FiMessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 mb-4">No hay mensajes predefinidos</p>
                    <button
                      onClick={() => setShowCrearModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
                    >
                      <FiPlus className="h-4 w-4" />
                      Crear Primer Mensaje
                    </button>
                  </div>
                ) : mensajesFiltrados.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
                    <FiSearch className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 mb-2">No se encontraron mensajes</p>
                    <p className="text-xs text-gray-400">Intenta con otros términos de búsqueda</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {mensajesFiltrados.map((m) => (
                      <div
                        key={m.id}
                        className={`p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                          mensaje === m.texto
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                            : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-green-300 dark:hover:border-green-600'
                        }`}
                        onClick={() => setMensaje(m.texto)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className={`text-sm flex-1 ${
                            mensaje === m.texto
                              ? 'text-green-900 dark:text-green-100'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {m.texto.length > 100 ? `${m.texto.substring(0, 100)}...` : m.texto}
                          </p>
                          <div className="flex items-center gap-2">
                            {mensaje === m.texto && (
                              <FiCheck className="h-4 w-4 text-green-500" />
                            )}
                            <button
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEliminar(m.id);
                              }}
                              disabled={loading}
                            >
                              <FiTrash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SEGUNDO: Editor de mensaje */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <FiMessageCircle className="h-4 w-4 inline mr-2 text-green-500" />
                    Mensaje a Enviar
                  </label>
                  <textarea
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-green-500 focus:outline-none transition-colors resize-none"
                    placeholder="Selecciona un mensaje predefinido o escribe uno nuevo..."
                    value={mensaje}
                    onChange={e => setMensaje(e.target.value)}
                    rows={6}
                  />
                </div>
              </div>
            </div>

            {/* Botones fijos en la parte inferior */}
            <div className="bg-white dark:bg-gray-800 pt-4 mt-4 border-t border-gray-200 dark:border-gray-600 flex-shrink-0">
              <div className="flex gap-3">
                <button
                  className="flex-1 px-4 py-2.5 sm:px-6 sm:py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm sm:text-base"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  className="flex-1 px-4 py-2.5 sm:px-6 sm:py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
                  onClick={handleEnviar}
                  disabled={loading || !negocioConfig?.telefono || !validarTelefono(negocioConfig.telefono) || !mensaje.trim()}
                >
                  <FiSend className="h-4 w-4" />
                  Enviar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para crear mensaje predefinido */}
      {showCrearModal && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75" onClick={() => setShowCrearModal(false)}></div>

            <div className="relative inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-2xl rounded-3xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <FiPlus className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      Crear Mensaje Predefinido
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Guarda un mensaje para usar después
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCrearModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>

              {/* Contenido */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mensaje
                  </label>
                  <textarea
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none transition-colors resize-none"
                    placeholder="Escribe tu mensaje predefinido..."
                    value={nuevoMensaje}
                    onChange={e => setNuevoMensaje(e.target.value)}
                    rows={6}
                  />
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                <button
                  onClick={() => setShowCrearModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  onClick={handleGuardar}
                  disabled={loading || !nuevoMensaje.trim()}
                >
                  <FiSave className="h-4 w-4" />
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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