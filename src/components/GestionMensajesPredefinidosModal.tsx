import { useState, useEffect, useRef } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { FiMessageSquare, FiEdit3, FiSave, FiRotateCcw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { 
  obtenerMensajePredefinido, 
  actualizarMensajePredefinido, 
  crearMensajePredefinido,
  generarMensajeConDatosActuales,
  TipoMensaje,
  CanalMensaje,
  PLANTILLAS_BASE
} from '../utils/mensajeHelpers';
import { buildPublicFacturaUrl } from '../utils/urls';

interface MetodoPago {
  id: string;
  nombre: string;
  link?: string;
  descripcion?: string;
  activo: boolean;
  orden: number;
}

interface GestionMensajesPredefinidosModalProps {
  isOpen: boolean;
  onClose: () => void;
  factura: any;
  tipo: TipoMensaje;
  canal: CanalMensaje;
  metodoSeleccionado?: MetodoPago | null;
  onMensajeActualizado?: (mensaje: string) => void;
}

export default function GestionMensajesPredefinidosModal({
  isOpen,
  onClose,
  factura,
  tipo,
  canal,
  metodoSeleccionado,
  onMensajeActualizado
}: GestionMensajesPredefinidosModalProps) {
  const [mensajePredefinido, setMensajePredefinido] = useState<any>(null);
  const [mensajeEditado, setMensajeEditado] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mensajeActual, setMensajeActual] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Generar links para la factura
  const linkFactura = buildPublicFacturaUrl(factura?.id, factura);
  const linkPago = metodoSeleccionado?.link || 'https://stripe.com/payments/link';

  // Cargar mensaje predefinido al abrir el modal
  useEffect(() => {
    if (isOpen && factura) {
      cargarMensajePredefinido();
    }
  }, [isOpen, factura, tipo, canal]);

  const cargarMensajePredefinido = async () => {
    try {
      setIsLoading(true);
      const mensaje = await obtenerMensajePredefinido(tipo, canal);
      
      if (mensaje) {
        setMensajePredefinido(mensaje);
        
        // Para MOSTRAR: generar con datos reales
        const mensajeGenerado = generarMensajeConDatosActuales(mensaje, factura, linkFactura, linkPago, metodoSeleccionado?.descripcion);
        setMensajeActual(mensajeGenerado);
        
        // Para EDITAR: mostrar el contenido con variables (plantilla o contenido personalizado)
        const data = JSON.parse(mensaje.texto);
        let mensajeParaEditar;
        
        if (data.personalizado) {
          // Si está personalizado, usar el contenido guardado pero asegurar que tenga {descripcion}
          mensajeParaEditar = data.contenido;
          // Si no tiene la variable {descripcion}, agregarla
          if (!mensajeParaEditar.includes('{descripcion}')) {
            mensajeParaEditar = mensajeParaEditar.replace(
              'Agradecemos su preferencia.',
              '📝 Instrucciones adicionales:\n{descripcion}\n\nAgradecemos su preferencia.'
            );
            // Actualizar el mensaje guardado para incluir la nueva variable
            data.contenido = mensajeParaEditar;
            await actualizarMensajePredefinido(mensaje.id, mensajeParaEditar, true);
          }
        } else {
          // Si no está personalizado, usar la plantilla base ACTUALIZADA
          mensajeParaEditar = PLANTILLAS_BASE[tipo as TipoMensaje][canal as CanalMensaje];
        }
        setMensajeEditado(mensajeParaEditar);
      } else {
        // Si no existe, crear uno automáticamente
        await crearMensajePredefinido(tipo, canal, factura, linkFactura, linkPago, metodoSeleccionado?.descripcion);
        const nuevoMensaje = await obtenerMensajePredefinido(tipo, canal);
        setMensajePredefinido(nuevoMensaje);
        
        // Para MOSTRAR: generar con datos reales
        const mensajeGenerado = generarMensajeConDatosActuales(nuevoMensaje, factura, linkFactura, linkPago, metodoSeleccionado?.descripcion);
        setMensajeActual(mensajeGenerado);
        
        // Para EDITAR: mostrar plantilla base con variables ACTUALIZADAS
        setMensajeEditado(PLANTILLAS_BASE[tipo as TipoMensaje][canal as CanalMensaje]);
      }
    } catch (error) {
      console.error('Error cargando mensaje predefinido:', error);
      toast.error('Error al cargar el mensaje predefinido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditar = () => {
    setIsEditing(true);
  };

  const handleCancelarEdicion = () => {
    setIsEditing(false);
    // Restaurar el mensaje con variables, no con datos reales
    if (mensajePredefinido) {
      const data = JSON.parse(mensajePredefinido.texto);
      let mensajeParaEditar;
      
      if (data.personalizado) {
        // Si está personalizado, usar el contenido guardado pero asegurar que tenga {descripcion}
        mensajeParaEditar = data.contenido;
        // Si no tiene la variable {descripcion}, agregarla
        if (!mensajeParaEditar.includes('{descripcion}')) {
          mensajeParaEditar = mensajeParaEditar.replace(
            'Agradecemos su preferencia.',
            '📝 Instrucciones adicionales:\n{descripcion}\n\nAgradecemos su preferencia.'
          );
        }
              } else {
          // Si no está personalizado, usar la plantilla base ACTUALIZADA
          mensajeParaEditar = PLANTILLAS_BASE[tipo as TipoMensaje][canal as CanalMensaje];
        }
      setMensajeEditado(mensajeParaEditar);
    }
  };

  const handleGuardar = async () => {
    if (!mensajePredefinido) return;

    try {
      setIsLoading(true);
      
      const resultado = await Swal.fire({
        title: '¿Guardar cambios?',
        text: '¿Estás seguro de que quieres guardar este mensaje personalizado?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, guardar',
        cancelButtonText: 'Cancelar'
      });

      if (resultado.isConfirmed) {
        await actualizarMensajePredefinido(mensajePredefinido.id, mensajeEditado, true);
        
        // Generar mensaje final con datos reales usando el método seleccionado
        const mensajeFinal = generarMensajeConDatosActuales(
          { texto: JSON.stringify({ contenido: mensajeEditado, personalizado: true }) },
          factura,
          linkFactura,
          linkPago,
          metodoSeleccionado?.descripcion
        );
        setMensajeActual(mensajeFinal);
        setIsEditing(false);
        toast.success('Mensaje guardado exitosamente');
        
        if (onMensajeActualizado) {
          onMensajeActualizado(mensajeFinal);
        }
      }
    } catch (error) {
      console.error('Error guardando mensaje:', error);
      toast.error('Error al guardar el mensaje');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestaurarOriginal = async () => {
    try {
      const resultado = await Swal.fire({
        title: '¿Restaurar mensaje original?',
        text: '¿Estás seguro de que quieres restaurar el mensaje a su versión original?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, restaurar',
        cancelButtonText: 'Cancelar'
      });

      if (resultado.isConfirmed) {
        setIsLoading(true);
        await actualizarMensajePredefinido(mensajePredefinido.id, mensajeEditado, false);
        await cargarMensajePredefinido();
        setIsEditing(false);
        toast.success('Mensaje restaurado exitosamente');
        
        if (onMensajeActualizado) {
          onMensajeActualizado(mensajeActual);
        }
      }
    } catch (error) {
      console.error('Error restaurando mensaje:', error);
      toast.error('Error al restaurar el mensaje');
    } finally {
      setIsLoading(false);
    }
  };

  const insertarVariable = (variable: string) => {
    if (!isEditing || !textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const textoActual = mensajeEditado;
    
    // Insertar la variable en la posición del cursor
    const nuevoTexto = textoActual.substring(0, start) + variable + textoActual.substring(end);
    setMensajeEditado(nuevoTexto);
    
    // Actualizar la posición del cursor después de la variable insertada
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start + variable.length, start + variable.length);
      }
    }, 0);
  };

  const getTipoDisplay = () => {
    const tipos = {
      pendiente: 'Pendiente de Pago',
      pagada: 'Pagada',
      vencida: 'Vencida'
    };
    return tipos[tipo] || tipo;
  };

  const getCanalDisplay = () => {
    return canal === 'whatsapp' ? 'WhatsApp' : 'Email';
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-4xl w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
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
                  {getTipoDisplay()} - {getCanalDisplay()}
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
                <span className="ml-3 text-gray-600 dark:text-gray-400">Cargando mensaje...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Información de la factura */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Información de la Factura
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Número:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {factura?.numero_factura_formateado || factura?.numero_factura || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Total:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        ${parseFloat(factura?.total || 0).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        {factura?.estado === 'pagada' ? 'Balance:' : 'Saldo:'}
                      </span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        ${factura?.estado === 'pagada' ? '0.00' : parseFloat(factura?.saldo_pendiente || factura?.total || 0).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Estado:</span>
                      <p className="font-medium text-gray-900 dark:text-white capitalize">
                        {factura?.estado || 'pendiente'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Método de pago seleccionado */}
                {metodoSeleccionado && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                      Método de Pago Seleccionado
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          {metodoSeleccionado.nombre}
                        </span>
                      </div>
                      {metodoSeleccionado.link && (
                        <div>
                          <span className="text-green-500 dark:text-green-400">Link:</span>
                          <p className="text-green-700 dark:text-green-300 font-mono text-xs">
                            {metodoSeleccionado.link}
                          </p>
                        </div>
                      )}
                      {metodoSeleccionado.descripcion && (
                        <div>
                          <span className="text-green-500 dark:text-green-400">Instrucciones:</span>
                          <p className="text-green-700 dark:text-green-300">
                            {metodoSeleccionado.descripcion}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Editor de mensaje */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Contenido del Mensaje
                    </h3>
                    <div className="flex items-center space-x-2">
                      {!isEditing ? (
                        <button
                          onClick={handleEditar}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <FiEdit3 className="w-4 h-4" />
                          <span>Editar</span>
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={handleGuardar}
                            disabled={isLoading}
                            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            <FiSave className="w-4 h-4" />
                            <span>Guardar</span>
                          </button>
                          <button
                            onClick={handleCancelarEdicion}
                            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                          >
                            <XCircleIcon className="w-4 h-4" />
                            <span>Cancelar</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="relative">
                    <textarea
                      ref={textareaRef}
                      value={isEditing ? mensajeEditado : mensajeActual}
                      onChange={(e) => setMensajeEditado(e.target.value)}
                      disabled={!isEditing}
                      rows={12}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                      placeholder="Escribe tu mensaje aquí..."
                    />
                    
                    {!isEditing && mensajePredefinido && (
                      <div className="absolute top-2 right-2">
                        <button
                          onClick={handleRestaurarOriginal}
                          className="flex items-center space-x-1 px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded text-xs hover:bg-orange-200 dark:hover:bg-orange-800 transition-colors"
                          title="Restaurar mensaje original"
                        >
                          <FiRotateCcw className="w-3 h-3" />
                          <span>Restaurar</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Variables disponibles */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                      Variables disponibles {isEditing && '(haz clic para insertar)'}:
                    </h4>
                                         <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                       <button
                         onClick={() => insertarVariable('{numero}')}
                         disabled={!isEditing}
                         className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded text-blue-800 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                         title="Insertar número de factura"
                       >
                         {'{numero}'}
                       </button>
                       <button
                         onClick={() => insertarVariable('{monto}')}
                         disabled={!isEditing}
                         className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded text-blue-800 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                         title="Insertar monto total"
                       >
                         {'{monto}'}
                       </button>
                       <button
                         onClick={() => insertarVariable(tipo === 'pagada' ? '{balance}' : '{saldo}')}
                         disabled={!isEditing}
                         className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded text-blue-800 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                         title={tipo === 'pagada' ? "Insertar balance (para facturas pagadas)" : "Insertar saldo pendiente"}
                       >
                         {tipo === 'pagada' ? '{balance}' : '{saldo}'}
                       </button>
                       <button
                         onClick={() => insertarVariable('{link_factura}')}
                         disabled={!isEditing}
                         className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded text-blue-800 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                         title="Insertar link de la factura"
                       >
                         {'{link_factura}'}
                       </button>
                       {/* Variables de pago solo para facturas pendientes y vencidas */}
                       {tipo !== 'pagada' && (
                         <>
                           <button
                             onClick={() => insertarVariable('{link_pago}')}
                             disabled={!isEditing}
                             className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded text-blue-800 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                             title="Insertar link de pago"
                           >
                             {'{link_pago}'}
                           </button>
                           <button
                             onClick={() => insertarVariable('{descripcion}')}
                             disabled={!isEditing}
                             className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded text-blue-800 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                             title="Insertar descripción del método de pago"
                           >
                             {'{descripcion}'}
                           </button>
                           <button
                             onClick={() => insertarVariable('{instrucciones_pago}')}
                             disabled={!isEditing}
                             className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded text-blue-800 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                             title="Insertar instrucciones de pago dinámicas"
                           >
                             {'{instrucciones_pago}'}
                           </button>
                         </>
                       )}

                     </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cerrar
            </button>
            {!isEditing && (
              <button
                onClick={() => {
                  if (onMensajeActualizado) {
                    onMensajeActualizado(mensajeActual);
                  }
                  onClose();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Usar Mensaje
              </button>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
