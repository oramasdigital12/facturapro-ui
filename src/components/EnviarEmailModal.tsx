import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { createPortal } from 'react-dom';
import { 
  XMarkIcon, 
  MagnifyingGlassIcon, 
  EnvelopeIcon, 
  UserGroupIcon, 
  CheckIcon,
  ExclamationTriangleIcon,
  PaperAirplaneIcon,
  DocumentTextIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { FiCheckSquare, FiSquare } from 'react-icons/fi';
import MetodosPagoModal from './MetodosPagoModal';
import { buildPublicFacturaUrl } from '../utils/urls';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';

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
  const [portalMounted, setPortalMounted] = useState(false);

  // Controlar el montaje del portal
  useEffect(() => {
    setPortalMounted(true);
    return () => setPortalMounted(false);
  }, []);

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
    const linkPublico = buildPublicFacturaUrl(factura.id, factura);
    
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
    const nuevosSinEmail = sinEmail.filter(c => c.id !== id);
    setSinEmail(nuevosSinEmail);
    
    // Si no quedan clientes sin email, cerrar el modal
    if (nuevosSinEmail.length === 0) {
      setShowSinEmail(false);
    }
  };

  // Editar un cliente sin email
  const handleEditarSinEmail = (cliente: Cliente) => {
    console.log('Editando cliente sin email:', cliente);
    console.log('Clientes seleccionados actuales:', seleccionados.map(c => c.id));
    
    // Cerrar el modal de alerta primero
    setShowSinEmail(false);
    
    // Llamar a onEditCliente con un pequeño delay para asegurar que el modal se cierre primero
    setTimeout(() => {
      console.log('Llamando a onEditCliente con cliente:', cliente);
      onEditCliente(cliente, seleccionados.map(c => c.id));
    }, 100);
  };

  // Cerrar modal automáticamente si no hay clientes sin email
  useEffect(() => {
    if (sinEmail.length === 0 && showSinEmail) {
      setShowSinEmail(false);
    }
  }, [sinEmail.length, showSinEmail]);

  // Manejar tecla ESC para cerrar modal de alerta
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showSinEmail) {
        console.log('ESC pressed - closing modal');
        setShowSinEmail(false);
      }
    };

    if (showSinEmail) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showSinEmail]);

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
  const handleEnviarEmail = async () => {
    if (seleccionados.length === 0) return;

    // Si hay factura pendiente y no se ha seleccionado método de pago, mostrar modal
    if (factura && factura.estado === 'pendiente' && !metodoSeleccionado) {
      setShowMetodosPago(true);
      return;
    }

    // Confirmar envío con SweetAlert
    const result = await Swal.fire({
      title: '¿Enviar email?',
      text: `¿Deseas enviar el email a ${seleccionados.length} cliente${seleccionados.length > 1 ? 's' : ''}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#22c55e',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, enviar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    });

    if (!result.isConfirmed) return;

    const emails = seleccionados.map(c => c.email).join(',');
    const mailto = `mailto:${emails}?subject=${encodeURIComponent(titulo)}&body=${encodeURIComponent(descripcion)}`;
    window.location.href = mailto;
    
    // Mostrar mensaje de éxito
    toast.success(`Email preparado para ${seleccionados.length} cliente${seleccionados.length > 1 ? 's' : ''}`);
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
      <Dialog open={open} onClose={onClose} className="relative z-[1000]">
        {/* Backdrop con blur moderno */}
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
        
        {/* Contenedor principal */}
        <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-6">
          <Dialog.Panel className="mx-auto w-full max-w-2xl bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden transform transition-all duration-300 ease-out">
            
            {/* Header moderno con gradiente */}
            <div className="relative bg-gradient-to-r from-green-600 via-green-700 to-emerald-700 px-6 py-6 sm:px-8 sm:py-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                      <EnvelopeIcon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <Dialog.Title className="text-xl sm:text-2xl font-bold text-white">
                      📧 Enviar Email
                    </Dialog.Title>
                    <p className="text-green-100 text-sm sm:text-base mt-1">
                      Selecciona los clientes y escribe tu mensaje
                    </p>
                  </div>
                </div>
                
                {/* Botón cerrar moderno */}
                <button
                  onClick={onClose}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-2xl flex items-center justify-center backdrop-blur-sm transition-all duration-200 hover:scale-110 group"
                >
                  <XMarkIcon className="w-5 h-5 text-white group-hover:rotate-90 transition-transform duration-200" />
                </button>
              </div>
            </div>

            {/* Contenido del formulario */}
            <div className="flex flex-col">
              <div className="flex-1 overflow-y-auto max-h-[70vh] sm:max-h-[75vh]">
                <div className="p-6 sm:p-8 space-y-6">
                  
                  {/* Información de la factura si existe */}
                  {factura && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-700">
                      <div className="flex items-center mb-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-3">
                          <DocumentTextIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                          Información de Factura
                        </h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Factura:</span>
                          <span className="font-semibold text-gray-800 dark:text-white ml-2">#{factura.numero_factura}</span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Estado:</span>
                          <span className={`font-semibold ml-2 ${
                            factura.estado === 'pendiente' 
                              ? 'text-yellow-600 dark:text-yellow-400' 
                              : 'text-green-600 dark:text-green-400'
                          }`}>
                            {factura.estado}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Total:</span>
                          <span className="font-semibold text-gray-800 dark:text-white ml-2">${factura.total?.toFixed(2)}</span>
                        </div>
                        {factura.estado === 'pendiente' && (
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Balance:</span>
                            <span className="font-semibold text-red-600 dark:text-red-400 ml-2">${factura.balance_restante?.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Sección de selección de clientes */}
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 rounded-2xl p-6 border border-gray-100 dark:border-gray-600">
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-3">
                        <UserGroupIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                        Seleccionar Clientes
                      </h3>
                    </div>

                    {/* Búsqueda y selector "Todos" */}
                    <div className="mb-4">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Buscar cliente por nombre..."
                          className="w-full px-4 py-3 pl-12 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          value={busqueda}
                          onChange={e => setBusqueda(e.target.value)}
                        />
                        <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      </div>
                      
                      {/* Selector "Todos" */}
                      <div className="mt-3 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={todosSeleccionados ? handleQuitarTodos : handleSeleccionarTodos}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-xl transition-all duration-200 hover:scale-105"
                        >
                          {todosSeleccionados ? (
                            <FiCheckSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <FiSquare className="h-5 w-5 text-gray-400" />
                          )}
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Seleccionar Todos
                          </span>
                        </button>
                        
                        {seleccionados.length > 0 && (
                          <button
                            onClick={handleQuitarTodos}
                            className="px-3 py-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105"
                          >
                            Limpiar Selección
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Lista de clientes */}
                    <div className="bg-white dark:bg-gray-700 rounded-xl border-2 border-gray-200 dark:border-gray-600 max-h-48 overflow-y-auto">
                      <div className="divide-y divide-gray-200 dark:divide-gray-600">
                        {/* Clientes sin email primero */}
                        {clientesFiltrados.filter(c => (!c.email || c.email.trim() === '') && !seleccionados.some(s => s.id === c.id)).map(cliente => (
                          <div
                            key={cliente.id}
                            className="p-3 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition-colors"
                            onClick={() => handleSeleccionarCliente(cliente)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                                  <UserIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
                                </div>
                                <span className="font-medium text-gray-800 dark:text-white">{cliente.nombre}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 rounded-full font-semibold">
                                  Sin email
                                </span>
                                <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {/* Clientes con email pero no seleccionados */}
                        {clientesFiltrados.filter(c => c.email && c.email.trim() !== '' && !seleccionados.some(s => s.id === c.id)).map(cliente => (
                          <div
                            key={cliente.id}
                            className="p-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors"
                            onClick={() => handleSeleccionarCliente(cliente)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                  <UserIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                  <span className="font-medium text-gray-800 dark:text-white">{cliente.nombre}</span>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">{cliente.email}</div>
                                </div>
                              </div>
                              <EnvelopeIcon className="w-4 h-4 text-green-500" />
                            </div>
                          </div>
                        ))}
                        
                        {/* Clientes seleccionados */}
                        {clientesFiltrados.filter(c => seleccionados.some(s => s.id === c.id)).map(cliente => (
                          <div
                            key={cliente.id}
                            className="p-3 bg-blue-100 dark:bg-blue-900/30 cursor-pointer transition-colors"
                            onClick={() => handleQuitarCliente(cliente.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                                  <CheckIcon className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <span className="font-semibold text-blue-800 dark:text-blue-200">{cliente.nombre}</span>
                                  <div className="text-xs text-blue-600 dark:text-blue-400">{cliente.email}</div>
                                </div>
                              </div>
                              <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full font-semibold">
                                Seleccionado
                              </span>
                            </div>
                          </div>
                        ))}
                        
                        {clientesFiltrados.length === 0 && (
                          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                            <UserGroupIcon className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                            <p>No se encontraron clientes</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sección de clientes seleccionados */}
                  {seleccionados.length > 0 && (
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-700">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mr-3">
                            <CheckIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                            Clientes Seleccionados ({seleccionados.length})
                          </h3>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                        {seleccionados.map(cliente => (
                          <div key={cliente.id} className="flex items-center bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-full px-3 py-2 text-sm font-medium">
                            <span className="mr-2">{cliente.nombre}</span>
                            <button 
                              onClick={() => handleQuitarCliente(cliente.id)} 
                              className="ml-1 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 transition-colors"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sección de composición del email */}
                  <div className="bg-gradient-to-r from-gray-50 to-purple-50 dark:from-gray-700 dark:to-purple-900/20 rounded-2xl p-6 border border-gray-100 dark:border-gray-600">
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mr-3">
                        <DocumentTextIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                        Componer Email
                      </h3>
                    </div>

                    <div className="space-y-4">
                      {/* Título del email */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Título del Email *
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          value={titulo}
                          onChange={e => setTitulo(e.target.value)}
                          placeholder="Asunto del email..."
                        />
                      </div>

                      {/* Descripción del email */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Mensaje del Email *
                        </label>
                        <textarea
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none min-h-[120px]"
                          value={descripcion}
                          onChange={e => setDescripcion(e.target.value)}
                          placeholder="Escribe tu mensaje aquí..."
                          rows={6}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer con botones modernos */}
              <div className="bg-gradient-to-r from-gray-50 to-green-50 dark:from-gray-700 dark:to-green-900/20 px-6 py-6 sm:px-8 sm:py-8 border-t border-gray-200 dark:border-gray-600">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200 hover:scale-105 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-900/30"
                  >
                    ❌ Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleEnviarEmail}
                    disabled={!titulo || !descripcion || seleccionados.length === 0}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all duration-200 hover:scale-105 focus:ring-4 focus:ring-green-100 dark:focus:ring-green-900/30 disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                  >
                    <PaperAirplaneIcon className="w-5 h-5" />
                    <span>📧 Enviar Email</span>
                  </button>
                </div>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Modal de alerta para clientes sin email - Usando Portal */}
      {showSinEmail && sinEmail.length > 0 && portalMounted && createPortal(
        <div 
          className="fixed inset-0 z-[999999]"
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <div className="flex items-center justify-center min-h-screen p-4">
            <div 
              className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-2xl max-w-md w-full mx-4"
              style={{ 
                position: 'relative',
                zIndex: 1000000
              }}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ExclamationTriangleIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <h3 className={`text-xl font-bold ${modoIndividual ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400'}`}>
                  {modoIndividual ? 'Cliente sin email' : 'Clientes sin email'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  {modoIndividual 
                    ? 'Este cliente no tiene un email registrado.' 
                    : 'Algunos clientes no tienen email registrado.'
                  }
                </p>
              </div>
              
              <div className="space-y-3 mb-6">
                {sinEmail.map(cliente => (
                  <div key={cliente.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                    <span className="font-medium text-gray-800 dark:text-white">{cliente.nombre}</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Añadir email clicked for:', cliente.nombre);
                          handleEditarSinEmail(cliente);
                        }}
                      >
                        Añadir Email
                      </button>
                      <button
                        type="button"
                        className="p-1 text-red-500 hover:text-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Quitar cliente clicked for:', cliente.nombre);
                          handleQuitarSinEmail(cliente.id);
                        }}
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <button
                type="button"
                className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Cerrar modal clicked');
                  setShowSinEmail(false);
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

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