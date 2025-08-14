import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { FiCheckSquare, FiSquare } from 'react-icons/fi';
import MetodosPagoModal from './MetodosPagoModal';

interface Cliente {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  categoria: string;
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
  clientes: Cliente[];
  onEditCliente: (cliente: Cliente, ids: string[]) => void;
  clientesPreseleccionados?: string[]; // IDs de clientes a seleccionar tras edición
  factura?: any; // Añadir factura como prop opcional
}

export default function EnviarEmailModal({ 
  open, 
  onClose, 
  clientes, 
  onEditCliente, 
  clientesPreseleccionados = [], 
  factura 
}: Props) {
  const [busqueda, setBusqueda] = useState('');
  const [seleccionados, setSeleccionados] = useState<Cliente[]>([]);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [showSinEmail, setShowSinEmail] = useState(false);
  const [sinEmail, setSinEmail] = useState<Cliente[]>([]);
  const [modoIndividual, setModoIndividual] = useState(false);
  const [showMetodosPago, setShowMetodosPago] = useState(false);
  const [metodoSeleccionado, setMetodoSeleccionado] = useState<MetodoPago | null>(null);

  // Preselección tras edición
  useEffect(() => {
    if (clientesPreseleccionados.length > 0) {
      const seleccion = clientes.filter(c => 
        clientesPreseleccionados.includes(c.id) && 
        c.email && 
        c.email.trim() !== ''
      );
      setSeleccionados(seleccion);
      // Si hay clientes sin email, los mostramos en el modal de alerta
      const sinEmailNuevos = clientes.filter(c => 
        clientesPreseleccionados.includes(c.id) && 
        (!c.email || c.email.trim() === '')
      );
      if (sinEmailNuevos.length > 0) {
        setSinEmail(sinEmailNuevos);
        setShowSinEmail(true);
        setModoIndividual(sinEmailNuevos.length === 1);
      }
    }
  }, [clientesPreseleccionados, clientes]);

  // Generar mensaje automático basado en el estado de la factura
  const generarMensajeAutomatico = (factura: any, metodo?: MetodoPago | null) => {
    const linkPublico = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/factura/${factura.id}`;
    
    if (factura.estado === 'pendiente') {
      let titulo = `Factura #${factura.numero_factura} - Pendiente de Pago`;
      let descripcion = `Hola ${factura.cliente?.nombre},\n\n`;
      descripcion += `Te enviamos tu factura pendiente:\n\n`;
      descripcion += `📄 Factura #${factura.numero_factura}\n`;
      descripcion += `💰 Total: $${factura.total?.toFixed(2)}\n`;
      descripcion += `⚖️ Balance Pendiente: $${factura.balance_restante?.toFixed(2)}\n\n`;
      descripcion += `🔗 Ver factura: ${linkPublico}\n\n`;
      
      if (metodo) {
        descripcion += `💳 Método de Pago: ${metodo.nombre}\n`;
        if (metodo.link) {
          descripcion += `🔗 Pagar aquí: ${metodo.link}\n\n`;
        }
        if (metodo.descripcion) {
          descripcion += `📝 Instrucciones:\n${metodo.descripcion}\n\n`;
        }
      }
      
      descripcion += `Gracias por tu preferencia.\n\nSaludos cordiales.`;
      return { titulo, descripcion };
    } else if (factura.estado === 'pagada') {
      let titulo = `Factura #${factura.numero_factura} - Pago Confirmado`;
      let descripcion = `Hola ${factura.cliente?.nombre},\n\n`;
      descripcion += `¡Gracias por tu pago!\n\n`;
      descripcion += `✅ Factura #${factura.numero_factura} - PAGADA\n`;
      descripcion += `💰 Total pagado: $${factura.total?.toFixed(2)}\n`;
      descripcion += `📅 Fecha de pago: ${new Date(factura.fecha_pago).toLocaleDateString()}\n\n`;
      descripcion += `🔗 Ver factura completa: ${linkPublico}\n\n`;
      descripcion += `¡Esperamos verte pronto!\n\nSaludos cordiales.`;
      return { titulo, descripcion };
    }
    
    return { titulo: '', descripcion: '' };
  };

  // Seleccionar todos los clientes del sistema
  const handleSeleccionarTodos = () => {
    const todos = clientes.filter(c => !seleccionados.some(s => s.id === c.id));
    const sinEmailNuevos = todos.filter(c => !c.email || c.email.trim() === '');
    if (sinEmailNuevos.length > 0) {
      setSinEmail(sinEmailNuevos);
      setShowSinEmail(true);
      setModoIndividual(false);
    }
    setSeleccionados([
      ...seleccionados,
      ...todos.filter(c => c.email && c.email.trim() !== '')
    ]);
  };

  // Quitar todos los seleccionados
  const handleQuitarTodos = () => {
    setSeleccionados([]);
  };

  // Seleccionar un cliente
  const handleSeleccionarCliente = (cliente: Cliente) => {
    if (seleccionados.some(c => c.id === cliente.id)) return;
    if (!cliente.email || cliente.email.trim() === '') {
      setSinEmail([cliente]);
      setShowSinEmail(true);
      setModoIndividual(true);
      return;
    }
    setSeleccionados([...seleccionados, cliente]);
  };

  // Quitar un cliente de la selección
  const handleQuitarCliente = (id: string) => {
    setSeleccionados(seleccionados.filter(c => c.id !== id));
  };

  // Quitar un cliente de la lista de sin email
  const handleQuitarSinEmail = (id: string) => {
    setSinEmail(sinEmail.filter(c => c.id !== id));
  };

  // Editar un cliente sin email
  const handleEditarSinEmail = (cliente: Cliente) => {
    onEditCliente(cliente, seleccionados.map(c => c.id));
    setShowSinEmail(false); // Cerramos el modal de alerta mientras se edita
  };

  // Cuando se edita un cliente, si ya tiene email, añadirlo a seleccionados y quitarlo de sinEmail
  useEffect(() => {
    if (sinEmail.length > 0) {
      const actualizados = sinEmail.filter(c => c.email && c.email.trim() !== '');
      if (actualizados.length > 0) {
        setSeleccionados(prev => [...prev, ...actualizados]);
        setSinEmail(prev => prev.filter(c => !actualizados.some(a => a.id === c.id)));
        // Si quedan clientes sin email, volvemos a mostrar el modal de alerta
        if (sinEmail.filter(c => !actualizados.some(a => a.id === c.id)).length > 0) {
          setShowSinEmail(true);
        }
      }
    }
  }, [clientes]);

  // Enviar email usando mailto
  const handleEnviarEmail = () => {
    if (seleccionados.length === 0) return;

    // Si hay factura pendiente y no se ha seleccionado método de pago, mostrar modal
    if (factura && factura.estado === 'pendiente' && !metodoSeleccionado) {
      setShowMetodosPago(true);
      return;
    }

    const emails = seleccionados.map(c => c.email).join(',');
    const mailto = `mailto:${emails}?subject=${encodeURIComponent(titulo)}&body=${encodeURIComponent(descripcion)}`;
    window.location.href = mailto;
    onClose();
  };

  const handleMetodoSeleccionado = (metodo: MetodoPago) => {
    setMetodoSeleccionado(metodo);
    // Generar mensaje automático con el método seleccionado
    if (factura) {
      const mensajeAutomatico = generarMensajeAutomatico(factura, metodo);
      setTitulo(mensajeAutomatico.titulo);
      setDescripcion(mensajeAutomatico.descripcion);
    }
  };

  // Generar mensaje automático al abrir si hay factura
  useEffect(() => {
    if (open && factura && !titulo && !descripcion) {
      const mensajeAutomatico = generarMensajeAutomatico(factura, metodoSeleccionado);
      if (mensajeAutomatico.titulo && mensajeAutomatico.descripcion) {
        setTitulo(mensajeAutomatico.titulo);
        setDescripcion(mensajeAutomatico.descripcion);
      }
    }
  }, [open, factura, metodoSeleccionado]);

  // Checkbox visual para "Todos"
  const todosSeleccionados = seleccionados.length === clientes.filter(c => c.email && c.email.trim() !== '').length;

  // Filtrado dinámico de clientes (mostrar todos, sin email primero)
  const clientesFiltrados = [
    ...clientes.filter(c => c.nombre.toLowerCase().includes(busqueda.toLowerCase()) && (!c.email || c.email.trim() === '')),
    ...clientes.filter(c => c.nombre.toLowerCase().includes(busqueda.toLowerCase()) && c.email && c.email.trim() !== '')
  ];

  return (
    <>
      <Dialog open={open} onClose={onClose} className="relative z-[100]">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4">
          <Dialog.Panel className="mx-auto max-w-md w-full rounded-xl bg-white p-0 shadow-lg relative flex flex-col max-h-[90vh]">
            <form className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 min-h-0 overflow-y-auto px-6 pt-6 pb-4">
                {/* Botón de cerrar */}
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-200 focus:outline-none"
                  title="Cerrar"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-400" />
                </button>
                {/* Título centrado */}
                <Dialog.Title className="text-lg font-medium mb-4 text-center">Enviar Email</Dialog.Title>

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

                {/* Label e input de búsqueda */}
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Buscar cliente por nombre..."
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={busqueda}
                      onChange={e => setBusqueda(e.target.value)}
                    />
                    <div className="flex items-center select-none cursor-pointer ml-2" onClick={todosSeleccionados ? handleQuitarTodos : handleSeleccionarTodos}>
                      <span className="text-sm font-medium mr-1">Todos</span>
                      {todosSeleccionados ? (
                        <FiCheckSquare className="h-5 w-5 text-blue-600" />
                      ) : (
                        <FiSquare className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
                {/* Lista de clientes para seleccionar en un frame visual */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg shadow-inner mb-4 max-h-40 overflow-y-auto" style={{ overscrollBehavior: 'contain' }}>
                  <ul className="divide-y">
                    {/* Clientes sin email primero (no seleccionados) */}
                    {clientesFiltrados.filter(c => (!c.email || c.email.trim() === '') && !seleccionados.some(s => s.id === c.id)).map(cliente => (
                      <li
                        key={cliente.id}
                        className="py-2 px-2 flex items-center gap-2 hover:bg-blue-50 cursor-pointer"
                        onClick={() => handleSeleccionarCliente(cliente)}
                      >
                        <span>{cliente.nombre}</span>
                        <span className="ml-2 text-xs text-red-500 font-semibold">Sin email</span>
                      </li>
                    ))}
                    {/* Clientes con email pero no seleccionados */}
                    {clientesFiltrados.filter(c => c.email && c.email.trim() !== '' && !seleccionados.some(s => s.id === c.id)).map(cliente => (
                      <li
                        key={cliente.id}
                        className="py-2 px-2 flex items-center gap-2 hover:bg-blue-50 cursor-pointer"
                        onClick={() => handleSeleccionarCliente(cliente)}
                      >
                        <span>{cliente.nombre}</span>
                      </li>
                    ))}
                    {/* Clientes seleccionados con email */}
                    {clientesFiltrados.filter(c => seleccionados.some(s => s.id === c.id)).map(cliente => (
                      <li
                        key={cliente.id}
                        className="py-2 px-2 flex items-center gap-2 bg-blue-100/70 cursor-pointer"
                        onClick={() => handleQuitarCliente(cliente.id)}
                      >
                        <span className="font-semibold">{cliente.nombre}</span>
                        <span className="ml-auto text-xs text-blue-600">Seleccionado</span>
                      </li>
                    ))}
                    {clientesFiltrados.length === 0 && (
                      <li className="py-2 px-2 text-gray-400">No hay clientes</li>
                    )}
                  </ul>
                </div>

                {/* Emails seleccionados y botón quitar todos en sección separada */}
                {seleccionados.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-4 mt-2 shadow-inner">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-700">Clientes seleccionados</span>
                      <button
                        onClick={handleQuitarTodos}
                        className="px-3 py-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200 text-xs font-semibold shadow-sm transition-colors"
                      >
                        Quitar todos
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto pr-1">
                      {seleccionados.map(cliente => (
                        <div key={cliente.id} className="flex items-center bg-blue-100/70 text-blue-800 rounded-full px-3 py-1 text-xs font-medium">
                          <span className="mr-2">{cliente.nombre} - {cliente.email ? cliente.email : <span className='text-red-500 font-semibold'>Sin email</span>}</span>
                          <button onClick={() => handleQuitarCliente(cliente.id)} className="ml-1 text-blue-500 hover:text-blue-700">
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Inputs de email */}
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={titulo}
                    onChange={e => setTitulo(e.target.value)}
                    placeholder="Título del email"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={descripcion}
                    onChange={e => setDescripcion(e.target.value)}
                    rows={6}
                    placeholder="Escribe el mensaje del email"
                  />
                </div>

                {/* Modal/alerta para clientes sin email */}
                {showSinEmail && sinEmail.length > 0 && (
                  <div className="fixed inset-0 flex items-center justify-center z-[101] bg-black/30">
                    <div className="bg-white rounded-xl p-6 shadow-lg max-w-xs w-full relative">
                      <h3 className={`text-center font-semibold mb-3 ${modoIndividual ? 'text-orange-600' : 'text-red-600'}`}>{modoIndividual ? 'Cliente sin email' : 'Clientes sin email'}</h3>
                      <ul className="mb-4">
                        {sinEmail.map(cliente => (
                          <li key={cliente.id} className="flex items-center justify-between mb-2">
                            <span>{cliente.nombre}</span>
                            <div className="flex gap-2 items-center">
                              <button
                                onClick={() => handleEditarSinEmail(cliente)}
                                className="text-blue-600 hover:underline text-xs px-2 py-1 rounded border border-blue-100 bg-blue-50"
                              >
                                Añadir email
                              </button>
                              <button
                                onClick={() => handleQuitarSinEmail(cliente.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        onClick={() => setShowSinEmail(false)}
                        className="w-full py-2 rounded bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 mt-2"
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4 border-t bg-white flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleEnviarEmail}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
                  disabled={!titulo || !descripcion || seleccionados.length === 0}
                >
                  Enviar email
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>

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