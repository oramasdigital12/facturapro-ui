import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { FiMessageSquare, FiEdit3, FiSave, FiRotateCcw } from 'react-icons/fi';
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

interface GestionMensajeFacturaModalProps {
  open: boolean;
  onClose: () => void;
  factura: any;
}

export default function GestionMensajeFacturaModal({ 
  open, 
  onClose, 
  factura
}: GestionMensajeFacturaModalProps) {
  const [selectedCanal, setSelectedCanal] = useState<CanalMensaje>('whatsapp');
  const [mensajeEditado, setMensajeEditado] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mensajeActual, setMensajeActual] = useState('');

  // Determinar el tipo de mensaje basado en el estado de la factura
  const getTipoMensaje = (): TipoMensaje => {
    if (factura.estado === 'pagada') return 'pagada';
    if (factura.estado === 'vencida') return 'vencida';
    if (factura.estado === 'por_vencer') return 'por_vencer';
    return 'pendiente';
  };

  const tipoMensaje = getTipoMensaje();

  // Función para cargar mensaje predefinido
  const cargarMensajePredefinido = async () => {
    setIsLoading(true);
    try {
      const mensaje = await obtenerMensajePredefinido(tipoMensaje, selectedCanal);
      if (mensaje) {
        try {
          const data = JSON.parse(mensaje.texto);
          setMensajeActual(data.contenido || PLANTILLAS_BASE[tipoMensaje][selectedCanal]);
          setMensajeEditado(data.contenido || PLANTILLAS_BASE[tipoMensaje][selectedCanal]);
        } catch {
          setMensajeActual(PLANTILLAS_BASE[tipoMensaje][selectedCanal]);
          setMensajeEditado(PLANTILLAS_BASE[tipoMensaje][selectedCanal]);
        }
      } else {
        setMensajeActual(PLANTILLAS_BASE[tipoMensaje][selectedCanal]);
        setMensajeEditado(PLANTILLAS_BASE[tipoMensaje][selectedCanal]);
      }
    } catch (error) {
      console.error('Error cargando mensaje:', error);
      setMensajeActual(PLANTILLAS_BASE[tipoMensaje][selectedCanal]);
      setMensajeEditado(PLANTILLAS_BASE[tipoMensaje][selectedCanal]);
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar mensaje cuando cambie el canal
  useEffect(() => {
    if (open && factura) {
      cargarMensajePredefinido();
    }
  }, [open, factura, selectedCanal]);

  // Función para insertar variable
  const insertarVariable = (variable: string) => {
    const textarea = document.getElementById('mensaje-factura-textarea') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = mensajeEditado;
      const before = text.substring(0, start);
      const after = text.substring(end);
      
      setMensajeEditado(before + variable + after);
      
      // Posicionar cursor después de la variable
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  // Función para guardar mensaje
  const guardarMensaje = async () => {
    setIsLoading(true);
    try {
      const mensaje = await obtenerMensajePredefinido(tipoMensaje, selectedCanal);
      
      if (mensaje) {
        // Actualizar mensaje existente
        await actualizarMensajePredefinido(mensaje.id, mensajeEditado, true);
        toast.success('Mensaje actualizado correctamente');
      } else {
                 // Crear nuevo mensaje
         const mensajeData = {
           tipo: 'factura',
           categoria: tipoMensaje,
           canal: selectedCanal,
           plantilla: PLANTILLAS_BASE[tipoMensaje][selectedCanal],
           contenido: mensajeEditado,
           personalizado: true
         };

         await api.post('/api/mensajes', {
           texto: JSON.stringify(mensajeData),
           modulo: 'facturas'
         });
        toast.success('Mensaje guardado correctamente');
      }
      
      setMensajeActual(mensajeEditado);
      setIsEditing(false);
    } catch (error) {
      console.error('Error guardando mensaje:', error);
      toast.error('Error al guardar el mensaje');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para restaurar plantilla base
  const restaurarPlantilla = async () => {
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
      const plantillaBase = PLANTILLAS_BASE[tipoMensaje][selectedCanal];
      setMensajeEditado(plantillaBase);
      
      try {
        const mensaje = await obtenerMensajePredefinido(tipoMensaje, selectedCanal);
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

  const getEstadoDisplay = () => {
    const estados = {
      pendiente: 'Pendiente de Pago',
      pagada: 'Pagada',
      por_vencer: 'Por Vencer',
      vencida: 'Vencida'
    };
    return estados[tipoMensaje] || tipoMensaje;
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
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-4xl w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <FiMessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white">
                  Gestión de Mensaje Predefinido
                </Dialog.Title>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {getEstadoDisplay()} - Factura #{factura?.numero_factura}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Selector de canal */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Canal de comunicación:
                  </h3>
                  <div className="flex space-x-2">
                    {canales.map((canal) => (
                      <button
                        key={canal.id}
                        onClick={() => setSelectedCanal(canal.id)}
                        className={`px-4 py-2 rounded-lg border transition-all duration-200 flex items-center space-x-2 ${
                          selectedCanal === canal.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <span>{canal.icon}</span>
                        <span>{canal.nombre}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Variables disponibles */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Variables disponibles:
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {variables.map((variable) => (
                      <button
                        key={variable.variable}
                        onClick={() => insertarVariable(variable.variable)}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg text-sm hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                        title={variable.descripcion}
                      >
                        {variable.variable}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Editor de mensaje */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Contenido del mensaje:
                    </h3>
                    <div className="flex space-x-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={guardarMensaje}
                            disabled={isLoading}
                            className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-1 text-sm"
                          >
                            <FiSave className="w-3 h-3" />
                            <span>Guardar</span>
                          </button>
                          <button
                            onClick={() => {
                              setIsEditing(false);
                              setMensajeEditado(mensajeActual);
                            }}
                            className="px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setIsEditing(true)}
                            className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-1 text-sm"
                          >
                            <FiEdit3 className="w-3 h-3" />
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={restaurarPlantilla}
                            className="px-3 py-1 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center space-x-1 text-sm"
                          >
                            <FiRotateCcw className="w-3 h-3" />
                            <span>Restaurar</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <textarea
                    id="mensaje-factura-textarea"
                    value={mensajeEditado}
                    onChange={(e) => setMensajeEditado(e.target.value)}
                    disabled={!isEditing || isLoading}
                    className="w-full h-64 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    placeholder="Escribe tu mensaje aquí..."
                  />
                </div>

                {/* Información adicional */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Información de la factura:
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Número:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">#{factura?.numero_factura}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Total:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">${factura?.total || '0.00'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Estado:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">{getEstadoDisplay()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Saldo:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">${factura?.saldo_pendiente || factura?.total || '0.00'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
