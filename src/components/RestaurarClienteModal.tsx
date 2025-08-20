import { useState } from 'react';
import { FiUser, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../services/api';

interface RestaurarClienteModalProps {
  open: boolean;
  onClose: () => void;
  clienteData: any;
  onClienteRestaurado: (nuevoCliente: any) => void;
}

export default function RestaurarClienteModal({ 
  open, 
  onClose, 
  clienteData, 
  onClienteRestaurado 
}: RestaurarClienteModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: clienteData?.nombre || 'Cliente Restaurado',
    email: clienteData?.email || '',
    telefono: clienteData?.telefono || '',
    direccion: clienteData?.direccion || '',
    identification_number: clienteData?.identification_number || '',
    sexo: clienteData?.sexo || '',
    notas: clienteData?.notas || 'Cliente restaurado desde factura'
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRestaurar = async () => {
    if (!formData.nombre.trim()) {
      toast.error('El nombre del cliente es obligatorio');
      return;
    }

    setLoading(true);
    try {
      // Crear el cliente con los datos del formulario
      const clienteData = {
        nombre: formData.nombre.trim(),
        email: formData.email.trim() || null,
        telefono: formData.telefono.trim() || null,
        direccion: formData.direccion.trim() || null,
        identification_number: formData.identification_number.trim() || null,
        sexo: formData.sexo || null,
        notas: formData.notas.trim() || null,
        categoria: 'activo',
        fecha_inicio: '9999-12-31',
        fecha_vencimiento: '9999-12-31'
      };

      const response = await api.post('/api/clientes', clienteData);
      const nuevoCliente = response.data;

      toast.success(`Cliente "${formData.nombre}" restaurado exitosamente`);
      onClienteRestaurado(nuevoCliente);
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al restaurar el cliente');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75" onClick={onClose}></div>

        <div className="relative inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-2xl rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Restaurar Cliente
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>

                     {/* Información del cliente */}
           <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
             <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3">
               {clienteData?.nombre ? 'Datos del cliente encontrados en la factura:' : 'Crear nuevo cliente para esta factura:'}
             </h4>
             <div className="space-y-2 text-sm">
               {clienteData?.nombre ? (
                 <>
                   <div className="flex items-center gap-2">
                     <FiUser className="h-4 w-4 text-blue-500" />
                     <span className="text-blue-700 dark:text-blue-300">
                       <strong>Nombre:</strong> {clienteData.nombre}
                     </span>
                   </div>
                   {clienteData?.email && (
                     <div className="flex items-center gap-2">
                       <FiMail className="h-4 w-4 text-blue-500" />
                       <span className="text-blue-700 dark:text-blue-300">
                         <strong>Email:</strong> {clienteData.email}
                       </span>
                     </div>
                   )}
                   {clienteData?.telefono && (
                     <div className="flex items-center gap-2">
                       <FiPhone className="h-4 w-4 text-blue-500" />
                       <span className="text-blue-700 dark:text-blue-300">
                         <strong>Teléfono:</strong> {clienteData.telefono}
                       </span>
                     </div>
                   )}
                   {clienteData?.direccion && (
                     <div className="flex items-center gap-2">
                       <FiMapPin className="h-4 w-4 text-blue-500" />
                       <span className="text-blue-700 dark:text-blue-300">
                         <strong>Dirección:</strong> {clienteData.direccion}
                       </span>
                     </div>
                   )}
                 </>
               ) : (
                 <div className="text-blue-700 dark:text-blue-300">
                   <p>No se encontraron datos del cliente en esta factura.</p>
                   <p>Por favor, completa la información del cliente a continuación.</p>
                 </div>
               )}
             </div>
           </div>

          {/* Formulario */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre *
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => handleInputChange('nombre', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                placeholder="Nombre del cliente"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                placeholder="email@ejemplo.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Teléfono
              </label>
              <input
                type="tel"
                value={formData.telefono}
                onChange={(e) => handleInputChange('telefono', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                placeholder="1234567890"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Dirección
              </label>
              <input
                type="text"
                value={formData.direccion}
                onChange={(e) => handleInputChange('direccion', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                placeholder="Dirección del cliente"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notas
              </label>
              <textarea
                value={formData.notas}
                onChange={(e) => handleInputChange('notas', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                placeholder="Notas adicionales..."
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleRestaurar}
              disabled={loading || !formData.nombre.trim()}
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Restaurando...
                </>
              ) : (
                <>
                  <FiUser className="h-4 w-4" />
                  Restaurar Cliente
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
