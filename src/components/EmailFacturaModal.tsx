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

export default function EmailFacturaModal({ open, onClose, factura }: Props) {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [loading, setLoading] = useState(false);
  const [showMetodosPago, setShowMetodosPago] = useState(false);
  const [metodoSeleccionado, setMetodoSeleccionado] = useState<MetodoPago | null>(null);
  const [showEditCliente, setShowEditCliente] = useState(false);
  const [clienteEditado, setClienteEditado] = useState({
    nombre: factura?.cliente?.nombre || '',
    telefono: factura?.cliente?.telefono || '',
    email: factura?.cliente?.email || ''
  });

  useEffect(() => {
    if (open) {
      setTitulo('');
      setDescripcion('');
      setMetodoSeleccionado(null);
      setClienteEditado({
        nombre: factura?.cliente?.nombre || '',
        telefono: factura?.cliente?.telefono || '',
        email: factura?.cliente?.email || ''
      });
    }
  }, [open, factura]);

  const validarEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Generar mensaje automático basado en el estado de la factura
  const generarMensajeAutomatico = (factura: any, metodo?: MetodoPago) => {
    // Usar el link real de Supabase
    const linkPublico = factura.pdfUrl || `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/factura/${factura.id}`;
    
    if (factura.estado === 'pendiente') {
      let titulo = `Factura #${factura.numero_factura} - Pendiente de Pago`;
      let descripcion = `Hola,\n\n`;
      descripcion += `por aquí su factura y el link de la factura pendiente:\n\n`;
      descripcion += `📄 Factura #${factura.numero_factura}\n`;
      descripcion += `💰 Total: $${factura.total?.toFixed(2)}\n`;
      descripcion += `⚖️ Balance Pendiente: $${factura.balance_restante?.toFixed(2)}\n\n`;
      descripcion += `🔗 Link de la factura: ${linkPublico}\n\n`;
      
      if (metodo) {
        descripcion += `Para realizar pago del balance paga aquí:\n`;
        if (metodo.link) {
          descripcion += `🔗 ${metodo.link}\n\n`;
        }
        if (metodo.descripcion) {
          descripcion += `📝 ${metodo.descripcion}\n\n`;
        }
      }
      
      descripcion += `gracias,`;
      return { titulo, descripcion };
    } else if (factura.estado === 'pagada') {
      let titulo = `Factura #${factura.numero_factura} - Pago Confirmado`;
      let descripcion = `gracias por completar el pago\n\n`;
      descripcion += `por aquí le envío su factura pagada:\n\n`;
      descripcion += `✅ Factura #${factura.numero_factura} - PAGADA\n`;
      descripcion += `💰 Total pagado: $${factura.total?.toFixed(2)}\n`;
      descripcion += `📅 Fecha de pago: ${new Date(factura.fecha_pago).toLocaleDateString()}\n\n`;
      descripcion += `🔗 Link de la factura: ${linkPublico}`;
      return { titulo, descripcion };
    }
    
    return { titulo: '', descripcion: '' };
  };

  const handleEnviar = () => {
    // Si hay factura pendiente y no se ha seleccionado método de pago, mostrar modal
    if (factura && factura.estado === 'pendiente' && !metodoSeleccionado) {
      setShowMetodosPago(true);
      return;
    }

    // Validaciones para envío real
    if (!titulo.trim() || !descripcion.trim()) {
      toast.error('Completa el título y mensaje del email');
      return;
    }

    if (!clienteEditado.email || !validarEmail(clienteEditado.email)) {
      toast.error('El email del cliente no es válido');
      return;
    }

    const asunto = encodeURIComponent(titulo);
    const cuerpo = encodeURIComponent(descripcion);
    window.open(`mailto:${clienteEditado.email}?subject=${asunto}&body=${cuerpo}`, '_blank');
    onClose();
  };

  const handleMetodoSeleccionado = (metodo: MetodoPago) => {
    setMetodoSeleccionado(metodo);
    // Generar mensaje automático con el método seleccionado
    if (factura) {
      const mensajeAutomatico = generarMensajeAutomatico(factura, metodo);
      if (mensajeAutomatico.titulo && mensajeAutomatico.descripcion) {
        setTitulo(mensajeAutomatico.titulo);
        setDescripcion(mensajeAutomatico.descripcion);
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

    if (!clienteEditado.email.trim()) {
      toast.error('El email del cliente es obligatorio');
      return;
    }

    if (!validarEmail(clienteEditado.email)) {
      toast.error('El email no es válido');
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
        setTitulo('');
        setDescripcion('');
        return;
      }
      
      // Para facturas pagadas, generar mensaje automático inmediatamente
      if (factura.estado === 'pagada') {
        const mensajeAutomatico = generarMensajeAutomatico(factura);
        if (mensajeAutomatico.titulo && mensajeAutomatico.descripcion) {
          setTitulo(mensajeAutomatico.titulo);
          setDescripcion(mensajeAutomatico.descripcion);
        }
      }
    }
  }, [open, factura]);

  if (!open || !factura) return null;

  const emailValido = clienteEditado.email && validarEmail(clienteEditado.email);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
        <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
          <h2 className="text-xl font-bold mb-4 text-center">Enviar Email</h2>

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
                <p><strong>Email:</strong> 
                  <span className={emailValido ? 'text-green-600' : 'text-red-600'}>
                    {clienteEditado.email || 'No especificado'}
                  </span>
                  {emailValido && <FiCheck className="h-3 w-3 text-green-600 inline ml-1" />}
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
                  type="email"
                  placeholder="Email del cliente"
                  value={clienteEditado.email}
                  onChange={(e) => setClienteEditado({...clienteEditado, email: e.target.value})}
                  className={`w-full px-3 py-2 border rounded text-sm ${emailValido ? 'border-green-300' : 'border-red-300'}`}
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

          {/* Campos de email */}
          <div className="mb-4 space-y-3">
            {factura.estado === 'pendiente' && !metodoSeleccionado ? (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-700">
                  ⚠️ Para facturas pendientes, primero debes seleccionar un método de pago haciendo clic en "Seleccionar Método de Pago".
                </p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título del Email</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={titulo}
                    onChange={e => setTitulo(e.target.value)}
                    placeholder="Título del email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
                  <textarea
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={descripcion}
                    onChange={e => setDescripcion(e.target.value)}
                    rows={6}
                    placeholder="Escribe el mensaje del email"
                  />
                </div>
              </>
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
              className="flex-1 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
              onClick={handleEnviar}
              disabled={loading}
            >
              {factura.estado === 'pendiente' && !metodoSeleccionado ? 'Seleccionar Método de Pago' : 'Enviar Email'}
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
          tipoMensaje="email"
        />
      )}
    </>
  );
}
