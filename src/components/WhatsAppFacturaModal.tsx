import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { FiEdit, FiCheck } from 'react-icons/fi';
import MetodosPagoModal from './MetodosPagoModal';

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
  const [clienteEditado, setClienteEditado] = useState({
    nombre: factura?.cliente?.nombre || '',
    telefono: factura?.cliente?.telefono || '',
    email: factura?.cliente?.email || ''
  });

  useEffect(() => {
    // Detectar si es dispositivo móvil
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));

    if (open) {
      setMensaje('');
      setMetodoSeleccionado(null);
      setClienteEditado({
        nombre: factura?.cliente?.nombre || '',
        telefono: factura?.cliente?.telefono || '',
        email: factura?.cliente?.email || ''
      });
      fetchNegocioConfig();
    }
  }, [open, factura]);

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
    // Usar el link real de Supabase
    const linkPublico = factura.pdfUrl || `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/factura/${factura.id}`;
    
    if (factura.estado === 'pendiente') {
      let mensaje = `Hola,\n\n`;
      mensaje += `por aquí su factura y el link de la factura pendiente:\n\n`;
      mensaje += `📄 Factura #${factura.numero_factura}\n`;
      mensaje += `💰 Total: $${factura.total?.toFixed(2)}\n`;
      mensaje += `⚖️ Balance Pendiente: $${factura.balance_restante?.toFixed(2)}\n\n`;
      mensaje += `🔗 Link de la factura: ${linkPublico}\n\n`;
      
      if (metodo) {
        mensaje += `Para realizar pago del balance paga aquí:\n`;
        if (metodo.link) {
          mensaje += `🔗 ${metodo.link}\n\n`;
        }
        if (metodo.descripcion) {
          mensaje += `📝 ${metodo.descripcion}\n\n`;
        }
      }
      
      mensaje += `gracias,`;
      return mensaje;
    } else if (factura.estado === 'pagada') {
      let mensaje = `gracias por completar el pago\n\n`;
      mensaje += `por aquí le envío su factura pagada:\n\n`;
      mensaje += `✅ Factura #${factura.numero_factura} - PAGADA\n`;
      mensaje += `💰 Total pagado: $${factura.total?.toFixed(2)}\n`;
      mensaje += `📅 Fecha de pago: ${new Date(factura.fecha_pago).toLocaleDateString()}\n\n`;
      mensaje += `🔗 Link de la factura: ${linkPublico}`;
      return mensaje;
    }
    
    return '';
  };

  const handleEnviar = () => {
    // Si hay factura pendiente y no se ha seleccionado método de pago, mostrar modal
    if (factura && factura.estado === 'pendiente' && !metodoSeleccionado) {
      setShowMetodosPago(true);
      return;
    }

    // Validaciones para envío real
    if (!mensaje.trim()) {
      toast.error('Escribe o selecciona un mensaje');
      return;
    }

    if (!negocioConfig?.telefono || !validarTelefono(negocioConfig.telefono)) {
      toast.error('El número de teléfono del negocio no es válido. Verifica la configuración.');
      return;
    }

    if (!clienteEditado.telefono || !validarTelefono(clienteEditado.telefono)) {
      toast.error('El número de teléfono del cliente no es válido');
      return;
    }

    const texto = encodeURIComponent(mensaje.replace('{cliente}', clienteEditado.nombre));
    window.open(`https://wa.me/${clienteEditado.telefono}?text=${texto}`, '_blank');
    onClose();
  };

  const handleMetodoSeleccionado = (metodo: MetodoPago) => {
    setMetodoSeleccionado(metodo);
    // Generar mensaje automático con el método seleccionado
    if (factura) {
      const mensajeAutomatico = generarMensajeAutomatico(factura, metodo);
      if (mensajeAutomatico) {
        setMensaje(mensajeAutomatico);
        toast.success(`Método "${metodo.nombre}" seleccionado. Mensaje generado automáticamente.`);
      }
    }
    // Cerrar el modal de métodos de pago
    setShowMetodosPago(false);
  };

  const handleGuardarCliente = async () => {
    if (!clienteEditado.nombre.trim()) {
      toast.error('El nombre del cliente es obligatorio');
      return;
    }

    if (!clienteEditado.telefono.trim()) {
      toast.error('El teléfono del cliente es obligatorio');
      return;
    }

    if (!validarTelefono(clienteEditado.telefono)) {
      toast.error('El teléfono debe tener 10 dígitos');
      return;
    }

    setLoading(true);
    try {
      await api.put(`/api/clientes/${factura.cliente.id}`, {
        nombre: clienteEditado.nombre,
        telefono: clienteEditado.telefono,
        email: clienteEditado.email
      });
      
      toast.success('Cliente actualizado');
      setShowEditCliente(false);
      // Actualizar la factura localmente
      factura.cliente = {
        ...factura.cliente,
        nombre: clienteEditado.nombre,
        telefono: clienteEditado.telefono,
        email: clienteEditado.email
      };
    } catch (error) {
      toast.error('Error al actualizar cliente');
    } finally {
      setLoading(false);
    }
  };

  // Generar mensaje automático al abrir si hay factura
  useEffect(() => {
    if (open && factura) {
      // Para facturas pendientes, no generar mensaje automático hasta que se seleccione método
      if (factura.estado === 'pendiente') {
        setMensaje('');
        return;
      }
      
      // Para facturas pagadas, generar mensaje automático inmediatamente
      if (factura.estado === 'pagada') {
        const mensajeAutomatico = generarMensajeAutomatico(factura);
        if (mensajeAutomatico) {
          setMensaje(mensajeAutomatico);
        }
      }
    }
  }, [open, factura]);

  if (!open || !factura) return null;

  const telefonoValido = clienteEditado.telefono && validarTelefono(clienteEditado.telefono);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
        <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
          <h2 className="text-xl font-bold mb-4 text-center">Enviar WhatsApp</h2>

          {/* Información de la factura */}
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

          {/* Información del cliente */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Cliente</label>
              <button
                onClick={() => setShowEditCliente(!showEditCliente)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                <FiEdit className="h-4 w-4 inline mr-1" />
                Editar
              </button>
            </div>
            
            {!showEditCliente ? (
              <div className="text-sm">
                <p><strong>Nombre:</strong> {clienteEditado.nombre}</p>
                <p><strong>Teléfono:</strong> 
                  <span className={telefonoValido ? 'text-green-600' : 'text-red-600'}>
                    {clienteEditado.telefono || 'No especificado'}
                  </span>
                  {telefonoValido && <FiCheck className="h-3 w-3 text-green-600 inline ml-1" />}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Nombre del cliente"
                  value={clienteEditado.nombre}
                  onChange={(e) => setClienteEditado({...clienteEditado, nombre: e.target.value})}
                  className="w-full px-3 py-2 border rounded text-sm"
                />
                <input
                  type="tel"
                  placeholder="Teléfono (10 dígitos)"
                  value={clienteEditado.telefono}
                  onChange={(e) => setClienteEditado({...clienteEditado, telefono: e.target.value})}
                  className={`w-full px-3 py-2 border rounded text-sm ${telefonoValido ? 'border-green-300' : 'border-red-300'}`}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleGuardarCliente}
                    disabled={loading}
                    className="flex-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => setShowEditCliente(false)}
                    className="flex-1 px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Información del método de pago seleccionado */}
          {metodoSeleccionado && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-sm text-green-700">
                <p><strong>Método de Pago Seleccionado:</strong></p>
                <p className="font-semibold">{metodoSeleccionado.nombre}</p>
                {metodoSeleccionado.link && (
                  <p className="text-xs mt-1">
                    <strong>Link:</strong> <a href={metodoSeleccionado.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{metodoSeleccionado.link}</a>
                  </p>
                )}
                {metodoSeleccionado.descripcion && (
                  <p className="text-xs mt-1">
                    <strong>Instrucciones:</strong> {metodoSeleccionado.descripcion}
                  </p>
                )}
              </div>
            </div>
          )}

          {(!negocioConfig?.telefono || !validarTelefono(negocioConfig.telefono)) && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-700 mb-1">
                <span className="font-semibold">⚠️ Atención</span>
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

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
            {factura.estado === 'pendiente' && !metodoSeleccionado ? (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-700">
                  ⚠️ Para facturas pendientes, primero debes seleccionar un método de pago haciendo clic en "Seleccionar Método de Pago".
                </p>
              </div>
            ) : (
              <textarea
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Escribe o selecciona un mensaje..."
                value={mensaje}
                onChange={e => setMensaje(e.target.value)}
                rows={6}
              />
            )}
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
              disabled={loading}
            >
              {factura.estado === 'pendiente' && !metodoSeleccionado ? 'Seleccionar Método de Pago' : 'Enviar'}
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
