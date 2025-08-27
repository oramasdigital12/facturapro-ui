import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { FiMessageSquare, FiEdit3, FiSave, FiRotateCcw, FiCheck, FiClock, FiAlertTriangle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import api from '../services/api';
import { 
  obtenerMensajePredefinido, 
  actualizarMensajePredefinido, 
  TipoMensaje,
  CanalMensaje,
  PLANTILLAS_BASE
} from '../utils/mensajeHelpers';

interface GestionMensajesPredefinidosFacturaModalProps {
  open: boolean;
  onClose: () => void;
  statusInicial?: TipoMensaje; // Nuevo prop para filtrar automáticamente
  onMensajeActualizado?: (status: TipoMensaje, canal: CanalMensaje) => void; // Nuevo prop para comunicar cambios
}

interface StatusConfig {
  id: TipoMensaje;
  nombre: string;
  descripcion: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

 const STATUS_CONFIG: StatusConfig[] = [
   {
     id: 'pendiente',
     nombre: 'Pendiente a Pagar',
     descripcion: 'Facturas con saldo pendiente de pago',
     icon: <FiClock className="w-5 h-5" />,
     color: 'text-yellow-600',
     bgColor: 'bg-yellow-100 dark:bg-yellow-900'
   },
  {
    id: 'pagada',
    nombre: 'Completadas',
    descripcion: 'Facturas pagadas exitosamente',
    icon: <FiCheck className="w-5 h-5" />,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900'
  },
  {
    id: 'por_vencer',
    nombre: 'Por Vencer',
    descripcion: 'Facturas próximas a vencer',
    icon: <FiClock className="w-5 h-5" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900'
  },
  {
    id: 'vencida',
    nombre: 'Vencidas',
    descripcion: 'Facturas con fecha de vencimiento expirada',
    icon: <FiAlertTriangle className="w-5 h-5" />,
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900'
  }
];

export default function GestionMensajesPredefinidosFacturaModal({ 
  open, 
  onClose, 
  statusInicial,
  onMensajeActualizado
}: GestionMensajesPredefinidosFacturaModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<TipoMensaje | null>(statusInicial || null);
  const [selectedCanal, setSelectedCanal] = useState<CanalMensaje>('whatsapp');
  const [isLoading, setIsLoading] = useState(false);
  
  // Estado separado por canal para evitar pérdida de datos
  const [mensajesPorCanal, setMensajesPorCanal] = useState<{
    [key in CanalMensaje]: {
      mensajeActual: string;
      mensajeEditado: string;
      isEditing: boolean;
      hasChanges: boolean;
    }
  }>({
    whatsapp: {
      mensajeActual: '',
      mensajeEditado: '',
      isEditing: false,
      hasChanges: false
    },
    email: {
      mensajeActual: '',
      mensajeEditado: '',
      isEditing: false,
      hasChanges: false
    }
  });

  // Función para cargar mensaje predefinido
  const cargarMensajePredefinido = async () => {
    if (!selectedStatus || !selectedCanal) return;
    
    setIsLoading(true);
    try {
      const mensaje = await obtenerMensajePredefinido(selectedStatus, selectedCanal);
      let mensajeContenido = '';
      
      if (mensaje) {
        try {
          const data = JSON.parse(mensaje.texto);
          mensajeContenido = data.contenido || PLANTILLAS_BASE[selectedStatus][selectedCanal];
        } catch {
          mensajeContenido = PLANTILLAS_BASE[selectedStatus][selectedCanal];
        }
      } else {
        mensajeContenido = PLANTILLAS_BASE[selectedStatus][selectedCanal];
      }
      
      // Actualizar solo el canal actual
      setMensajesPorCanal(prev => ({
        ...prev,
        [selectedCanal]: {
          ...prev[selectedCanal],
          mensajeActual: mensajeContenido,
          mensajeEditado: mensajeContenido,
          isEditing: false,
          hasChanges: false
        }
      }));
    } catch (error) {
      console.error('Error cargando mensaje:', error);
      const mensajeContenido = PLANTILLAS_BASE[selectedStatus][selectedCanal];
      setMensajesPorCanal(prev => ({
        ...prev,
        [selectedCanal]: {
          ...prev[selectedCanal],
          mensajeActual: mensajeContenido,
          mensajeEditado: mensajeContenido,
          isEditing: false,
          hasChanges: false
        }
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // Función para validar cambios antes de cambiar de canal
  const validarCambioCanal = async (_nuevoCanal: CanalMensaje): Promise<boolean> => {
    const canalActual = mensajesPorCanal[selectedCanal];
    
    // Si hay cambios sin guardar en el canal actual
    if (canalActual.hasChanges && canalActual.isEditing) {
      const result = await Swal.fire({
        title: '¿Guardar cambios?',
        text: `Tienes cambios sin guardar en ${selectedCanal === 'whatsapp' ? 'WhatsApp' : 'Email'}. ¿Deseas guardarlos antes de cambiar de canal?`,
        icon: 'warning',
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: 'Guardar y cambiar',
        denyButtonText: 'Cambiar sin guardar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#2563eb',
        denyButtonColor: '#6b7280',
        cancelButtonColor: '#dc2626',
        reverseButtons: true
      });

      if (result.isConfirmed) {
        // Guardar cambios antes de cambiar
        await guardarMensaje();
        return true;
      } else if (result.isDenied) {
        // Cambiar sin guardar, descartar cambios
        setMensajesPorCanal(prev => ({
          ...prev,
          [selectedCanal]: {
            ...prev[selectedCanal],
            mensajeEditado: prev[selectedCanal].mensajeActual,
            isEditing: false,
            hasChanges: false
          }
        }));
        return true;
      } else {
        // Cancelar cambio
        return false;
      }
    }
    
    return true;
  };

  // Función para cambiar canal con validación
  const cambiarCanal = async (nuevoCanal: CanalMensaje) => {
    if (nuevoCanal === selectedCanal) return;
    
    const puedeCambiar = await validarCambioCanal(nuevoCanal);
    if (puedeCambiar) {
      setSelectedCanal(nuevoCanal);
    }
  };

  // Función para cambiar estado con validación
  const cambiarEstado = async (nuevoEstado: TipoMensaje) => {
    if (nuevoEstado === selectedStatus) return;
    
    const puedeCambiar = await validarCambioCanal(selectedCanal);
    if (puedeCambiar) {
      setSelectedStatus(nuevoEstado);
    }
  };

  // Actualizar status cuando cambie el prop statusInicial
  useEffect(() => {
    if (statusInicial && statusInicial !== selectedStatus) {
      setSelectedStatus(statusInicial);
    }
  }, [statusInicial]);

  // Cargar mensaje cuando cambie el status o canal
  useEffect(() => {
    if (selectedStatus && selectedCanal) {
      cargarMensajePredefinido();
    }
  }, [selectedStatus, selectedCanal]);

  // Función para insertar variable
  const insertarVariable = (variable: string) => {
    const textarea = document.getElementById('mensaje-textarea') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = mensajesPorCanal[selectedCanal].mensajeEditado;
      const before = text.substring(0, start);
      const after = text.substring(end);
      const nuevoTexto = before + variable + after;
      
      setMensajesPorCanal(prev => ({
        ...prev,
        [selectedCanal]: {
          ...prev[selectedCanal],
          mensajeEditado: nuevoTexto,
          hasChanges: nuevoTexto !== prev[selectedCanal].mensajeActual
        }
      }));
      
      // Posicionar cursor después de la variable
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

    // Función para guardar mensaje
  const guardarMensaje = async () => {
    if (!selectedStatus || !selectedCanal) return;
    
    setIsLoading(true);
    try {
      const mensajeEditadoActual = mensajesPorCanal[selectedCanal].mensajeEditado;
      const mensaje = await obtenerMensajePredefinido(selectedStatus, selectedCanal);
      
      if (mensaje) {
        // Actualizar mensaje existente
        await actualizarMensajePredefinido(mensaje.id, mensajeEditadoActual, true);
        toast.success('Mensaje actualizado correctamente');
      } else {
        // Crear nuevo mensaje
        const mensajeData = {
          tipo: 'factura',
          categoria: selectedStatus,
          canal: selectedCanal,
          plantilla: PLANTILLAS_BASE[selectedStatus][selectedCanal],
          contenido: mensajeEditadoActual,
          personalizado: true
        };

        await api.post('/api/mensajes', {
          texto: JSON.stringify(mensajeData),
          modulo: 'facturas'
        });
        toast.success('Mensaje guardado correctamente');
      }
      
      // Actualizar estado después de guardar
      setMensajesPorCanal(prev => ({
        ...prev,
        [selectedCanal]: {
          ...prev[selectedCanal],
          mensajeActual: mensajeEditadoActual,
          isEditing: false,
          hasChanges: false
        }
      }));

      // Notificar al padre que el mensaje se actualizó
      if (onMensajeActualizado) {
        onMensajeActualizado(selectedStatus, selectedCanal);
      }

    } catch (error) {
      console.error('Error guardando mensaje:', error);
      toast.error('Error al guardar el mensaje');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para restaurar plantilla base
  const restaurarPlantilla = async () => {
    if (!selectedStatus || !selectedCanal) return;
    
    const result = await Swal.fire({
      title: '¿Restaurar plantilla base?',
      text: 'Se perderán todos los cambios personalizados',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, restaurar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      const plantillaBase = PLANTILLAS_BASE[selectedStatus][selectedCanal];
      
      setMensajesPorCanal(prev => ({
        ...prev,
        [selectedCanal]: {
          ...prev[selectedCanal],
          mensajeEditado: plantillaBase,
          hasChanges: plantillaBase !== prev[selectedCanal].mensajeActual
        }
      }));
      
      try {
        const mensaje = await obtenerMensajePredefinido(selectedStatus, selectedCanal);
        if (mensaje) {
          await actualizarMensajePredefinido(mensaje.id, plantillaBase, false);
        }
        toast.success('Plantilla restaurada correctamente');
      } catch (error) {
        console.error('Error restaurando plantilla:', error);
        toast.error('Error al restaurar la plantilla');
      }
    }
  };

  // Función para iniciar edición
  const iniciarEdicion = () => {
    setMensajesPorCanal(prev => ({
      ...prev,
      [selectedCanal]: {
        ...prev[selectedCanal],
        isEditing: true
      }
    }));
  };

  // Función para cancelar edición
  const cancelarEdicion = () => {
    setMensajesPorCanal(prev => ({
      ...prev,
      [selectedCanal]: {
        ...prev[selectedCanal],
        mensajeEditado: prev[selectedCanal].mensajeActual,
        isEditing: false,
        hasChanges: false
      }
    }));
  };

  // Función para manejar cambios en el textarea
  const handleMensajeChange = (nuevoTexto: string) => {
    setMensajesPorCanal(prev => ({
      ...prev,
      [selectedCanal]: {
        ...prev[selectedCanal],
        mensajeEditado: nuevoTexto,
        hasChanges: nuevoTexto !== prev[selectedCanal].mensajeActual
      }
    }));
  };

  const getStatusConfig = (status: TipoMensaje) => {
    return STATUS_CONFIG.find(config => config.id === status);
  };

  const canales = [
    { id: 'whatsapp' as CanalMensaje, nombre: 'WhatsApp', icon: '📱' },
    { id: 'email' as CanalMensaje, nombre: 'Email', icon: '📧' }
  ];

  const variables = [
    { variable: '{numero}', descripcion: 'Número de factura' },
    { variable: '{monto}', descripcion: 'Monto total' },
    { variable: '{saldo}', descripcion: 'Saldo pendiente' },
    { variable: '{link_factura}', descripcion: 'Link de la factura' },
    { variable: '{instrucciones_pago}', descripcion: 'Instrucciones de pago' }
  ];

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4">
        <Dialog.Panel className="mx-auto w-full max-w-6xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl h-[95vh] sm:h-[90vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 lg:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900 rounded-lg flex-shrink-0">
                <FiMessageSquare className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <Dialog.Title className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 dark:text-white truncate">
                  Gestión de Mensajes
                </Dialog.Title>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                  Personaliza los mensajes para cada estado
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0 ml-2"
              title="Cerrar"
            >
              <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
            {/* Sidebar - Estados */}
            <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex-shrink-0">
              <div className="p-3 sm:p-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                  Estados de Factura
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                  {STATUS_CONFIG.map((status) => (
                    <button
                      key={status.id}
                      onClick={() => cambiarEstado(status.id)}
                      className={`w-full p-2 sm:p-3 lg:p-4 rounded-lg border transition-all duration-200 text-left ${
                        selectedStatus === status.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className={`p-1 sm:p-1.5 lg:p-2 rounded-lg ${status.bgColor} flex-shrink-0`}>
                          <div className={`${status.color} w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5`}>{status.icon}</div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm lg:text-base truncate">
                            {status.nombre}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 hidden lg:block">
                            {status.descripcion}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {selectedStatus ? (
                <>
                  {/* Header del estado seleccionado */}
                  <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        {(() => {
                          const config = getStatusConfig(selectedStatus);
                          return (
                            <>
                              <div className={`p-1.5 sm:p-2 lg:p-3 rounded-lg ${config?.bgColor} flex-shrink-0`}>
                                <div className={`${config?.color} w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6`}>{config?.icon}</div>
                              </div>
                              <div className="min-w-0 flex-1">
                                <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 dark:text-white truncate">
                                  {config?.nombre}
                                </h2>
                                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                                  {config?.descripcion}
                                </p>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                      
                      {/* Botones de acción - Solo en desktop */}
                      <div className="hidden lg:flex items-center space-x-2">
                        {mensajesPorCanal[selectedCanal]?.isEditing ? (
                          <>
                            <button
                              onClick={guardarMensaje}
                              disabled={isLoading}
                              className="px-3 lg:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-1 lg:space-x-2 text-sm"
                            >
                              <FiSave className="w-3 h-3 lg:w-4 lg:h-4" />
                              <span>Guardar</span>
                            </button>
                            <button
                              onClick={cancelarEdicion}
                              className="px-3 lg:px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                            >
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={iniciarEdicion}
                              className="px-3 lg:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-1 lg:space-x-2 text-sm"
                            >
                              <FiEdit3 className="w-3 h-3 lg:w-4 lg:h-4" />
                              <span>Editar</span>
                            </button>
                            <button
                              onClick={restaurarPlantilla}
                              className="px-3 lg:px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center space-x-1 lg:space-x-2 text-sm"
                            >
                              <FiRotateCcw className="w-3 h-3 lg:w-4 lg:h-4" />
                              <span>Restaurar</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Selector de canal */}
                  <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <h3 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
                      Canal de comunicación:
                    </h3>
                    <div className="flex space-x-2">
                      {canales.map((canal) => (
                        <button
                          key={canal.id}
                          onClick={() => cambiarCanal(canal.id)}
                          className={`px-2 sm:px-3 lg:px-4 py-2 rounded-lg border transition-all duration-200 flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm relative ${
                            selectedCanal === canal.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <span className="text-sm sm:text-base lg:text-lg">{canal.icon}</span>
                          <span>{canal.nombre}</span>
                          {/* Indicador de cambios sin guardar */}
                          {mensajesPorCanal[canal.id]?.hasChanges && mensajesPorCanal[canal.id]?.isEditing && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-orange-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Editor de mensaje */}
                  <div className="flex-1 p-3 sm:p-4 lg:p-6 overflow-y-auto">
                    <div className="h-full flex flex-col">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-2">
                        <h3 className="text-sm sm:text-base lg:text-lg font-medium text-gray-900 dark:text-white">
                          Contenido del mensaje
                        </h3>
                        <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          Variables disponibles:
                        </div>
                      </div>

                      {/* Variables disponibles */}
                      <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-4">
                        {variables.map((variable) => (
                          <button
                            key={variable.variable}
                            onClick={() => insertarVariable(variable.variable)}
                            className="px-1.5 sm:px-2 lg:px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg text-xs sm:text-sm hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                            title={variable.descripcion}
                          >
                            {variable.variable}
                          </button>
                        ))}
                      </div>

                      {/* Textarea */}
                      <div className="flex-1 min-h-[150px] sm:min-h-[200px] lg:min-h-0">
                        <textarea
                          id="mensaje-textarea"
                          value={mensajesPorCanal[selectedCanal]?.mensajeEditado || ''}
                          onChange={(e) => handleMensajeChange(e.target.value)}
                          disabled={!mensajesPorCanal[selectedCanal]?.isEditing || isLoading}
                          className="w-full h-full min-h-[150px] sm:min-h-[200px] lg:min-h-0 p-2 sm:p-3 lg:p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 text-xs sm:text-sm lg:text-base"
                          placeholder="Escribe tu mensaje aquí..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Botones de acción móvil - Solo en móvil */}
                  <div className="lg:hidden p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
                    <div className="flex items-center space-x-2">
                      {mensajesPorCanal[selectedCanal]?.isEditing ? (
                        <>
                          <button
                            onClick={guardarMensaje}
                            disabled={isLoading}
                            className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-sm font-medium"
                          >
                            <FiSave className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>Guardar</span>
                          </button>
                          <button
                            onClick={cancelarEdicion}
                            className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-xs sm:text-sm font-medium"
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={iniciarEdicion}
                            className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-sm font-medium"
                          >
                            <FiEdit3 className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={restaurarPlantilla}
                            className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-sm font-medium"
                          >
                            <FiRotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>Restaurar</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center p-4">
                  <div className="text-center">
                    <FiMessageSquare className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                    <h3 className="text-sm sm:text-base lg:text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Selecciona un estado
                    </h3>
                    <p className="text-xs sm:text-sm lg:text-base text-gray-500 dark:text-gray-400">
                      Elige un estado de factura para gestionar sus mensajes predefinidos
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
