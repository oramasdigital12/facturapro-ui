import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { Dialog } from '@headlessui/react';
import { 
  UserIcon, 
  PhoneIcon, 
  EnvelopeIcon, 
  IdentificationIcon, 
  MapPinIcon, 
  DocumentTextIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  cliente?: any | null;
}

function validarNombre(nombre: string) {
  return /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{2,}$/.test(nombre);
}

function validarTelefono(telefono: string) {
  return /^\d{10}$/.test(telefono);
}

function validarEmail(email: string) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

export default function ClienteModal({ open, onClose, onCreated, cliente }: Props) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    email: '',
    identification_number: '',
    sexo: '',
    direccion: '',
    notas: '',
  });
  const [status, setStatus] = useState<'inactivo' | 'activo' | ''>('');
  const [loading, setLoading] = useState(false);
  const [errores, setErrores] = useState<{ [key: string]: string }>({});

  // Debug: Monitorear cambios en open
  useEffect(() => {
    console.log('ClienteModal - open cambiado:', open);
  }, [open]);

  // Debug: Monitorear cambios en cliente
  useEffect(() => {
    console.log('ClienteModal - cliente cambiado:', cliente);
  }, [cliente]);

  useEffect(() => {
    if (cliente) {
      setForm({
        nombre: cliente.nombre || '',
        telefono: cliente.telefono || '',
        email: cliente.email || '',
        identification_number: cliente.identification_number || '',
        sexo: cliente.sexo || '',
        direccion: cliente.direccion || '',
        notas: cliente.notas || '',
      });
      setStatus(cliente.categoria === 'inactivo' ? 'inactivo' : 'activo');
    } else {
      setForm({
        nombre: '',
        telefono: '',
        email: '',
        identification_number: '',
        sexo: '',
        direccion: '',
        notas: '',
      });
      setStatus('');
    }
    setErrores({});
  }, [cliente]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errores[name]) {
      setErrores(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validarFormulario = () => {
    const nuevosErrores: { [key: string]: string } = {};

    if (!form.nombre.trim()) {
      nuevosErrores.nombre = 'El nombre es requerido';
    } else if (!validarNombre(form.nombre.trim())) {
      nuevosErrores.nombre = 'El nombre debe tener al menos 2 caracteres y solo letras';
    }

    if (!form.telefono.trim()) {
      nuevosErrores.telefono = 'El teléfono es requerido';
    } else if (!validarTelefono(form.telefono.trim())) {
      nuevosErrores.telefono = 'El teléfono debe tener 10 dígitos';
    }

    if (form.email.trim() && !validarEmail(form.email.trim())) {
      nuevosErrores.email = 'El email no es válido';
    }

    if (!status) {
      nuevosErrores.status = 'Debes seleccionar un estado';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    // Confirmar antes de crear/actualizar con SweetAlert
    const result = await Swal.fire({
      title: cliente ? '¿Actualizar cliente?' : '¿Crear cliente?',
      text: cliente 
        ? `¿Deseas actualizar la información de "${form.nombre}"?` 
        : `¿Deseas crear el cliente "${form.nombre}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: cliente ? 'Sí, actualizar' : 'Sí, crear',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    });

    if (!result.isConfirmed) return;

    setLoading(true);
    try {
      // Mostrar loading inmediato
      toast.loading(cliente ? 'Actualizando cliente...' : 'Creando cliente...', { id: 'clienteAction' });
      
      // Construir el objeto data solo con los campos llenados o null
      const data: any = {
        nombre: form.nombre,
        user_id: user?.id,
        categoria: status,
        fecha_inicio: '9999-12-31',
        fecha_vencimiento: '9999-12-31',
      };
      ['telefono', 'email', 'identification_number', 'sexo', 'direccion', 'notas'].forEach((campo) => {
        const valor = (form as any)[campo];
        data[campo] = valor === undefined || valor === null || valor === '' ? null : valor;
      });
      
      if (cliente && cliente.id) {
        await api.put(`/api/clientes/${cliente.id}`, data);
      } else {
        await api.post('/api/clientes', data);
      }
      
      // Cerrar loading y mostrar éxito
      toast.dismiss('clienteAction');
      toast.success(cliente ? 'Cliente actualizado exitosamente' : 'Cliente creado exitosamente');
      onCreated();
      onClose();
    } catch (err: any) {
      toast.dismiss('clienteAction');
      toast.error(err.response?.data?.message || 'Error al guardar cliente');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog 
      open={open} 
      onClose={() => {
        console.log('ClienteModal - Dialog onClose llamado');
        onClose();
      }} 
      className="relative z-[200]"
    >
      {/* Backdrop con blur moderno */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
      
      {/* Contenedor principal */}
      <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-6">
        <Dialog.Panel className="mx-auto w-full max-w-2xl bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden transform transition-all duration-300 ease-out">
          
          {/* Header moderno con gradiente */}
          <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-6 py-6 sm:px-8 sm:py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <UserIcon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <Dialog.Title className="text-xl sm:text-2xl font-bold text-white">
                    {cliente ? '✏️ Editar Cliente' : '🚀 Nuevo Cliente'}
                  </Dialog.Title>
                  <p className="text-blue-100 text-sm sm:text-base mt-1">
                    {cliente ? 'Actualiza la información del cliente' : 'Completa los datos para crear un nuevo cliente'}
                  </p>
                </div>
              </div>
              
              {/* Botón cerrar moderno */}
              <button
                onClick={() => {
                  console.log('ClienteModal - Botón X clickeado');
                  onClose();
                }}
                className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-2xl flex items-center justify-center backdrop-blur-sm transition-all duration-200 hover:scale-110 group"
              >
                <XMarkIcon className="w-5 h-5 text-white group-hover:rotate-90 transition-transform duration-200" />
              </button>
            </div>
          </div>

          {/* Contenido del formulario */}
          <form onSubmit={handleSubmit} className="flex flex-col">
            <div className="flex-1 overflow-y-auto max-h-[70vh] sm:max-h-[75vh]">
              <div className="p-6 sm:p-8 space-y-6">
                
                {/* Selector de estado moderno */}
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 rounded-2xl p-6 border border-gray-100 dark:border-gray-600">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-3">
                      <CheckIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    Estado del Cliente
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <label className={`relative cursor-pointer group transition-all duration-200 ${
                      status === 'inactivo' ? 'scale-105' : 'hover:scale-102'
                    }`}>
                      <input
                        type="radio"
                        checked={status === 'inactivo'}
                        onChange={() => setStatus('inactivo')}
                        className="sr-only"
                      />
                      <div className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        status === 'inactivo' 
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/20 shadow-lg' 
                          : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-red-300 dark:hover:border-red-400'
                      }`}>
                        <div className="flex items-center justify-center space-x-3">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            status === 'inactivo' 
                              ? 'border-red-500 bg-red-500' 
                              : 'border-gray-300 dark:border-gray-500'
                          }`}>
                            {status === 'inactivo' && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                          <span className={`font-semibold ${
                            status === 'inactivo' 
                              ? 'text-red-700 dark:text-red-400' 
                              : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            Inactivo
                          </span>
                        </div>
                      </div>
                    </label>

                    <label className={`relative cursor-pointer group transition-all duration-200 ${
                      status === 'activo' ? 'scale-105' : 'hover:scale-102'
                    }`}>
                      <input
                        type="radio"
                        checked={status === 'activo'}
                        onChange={() => setStatus('activo')}
                        className="sr-only"
                      />
                      <div className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        status === 'activo' 
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-lg' 
                          : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-green-300 dark:hover:border-green-400'
                      }`}>
                        <div className="flex items-center justify-center space-x-3">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            status === 'activo' 
                              ? 'border-green-500 bg-green-500' 
                              : 'border-gray-300 dark:border-gray-500'
                          }`}>
                            {status === 'activo' && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                          <span className={`font-semibold ${
                            status === 'activo' 
                              ? 'text-green-700 dark:text-green-400' 
                              : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            Activo
                          </span>
                        </div>
                      </div>
                    </label>
                  </div>
                  
                  {errores.status && (
                    <div className="mt-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                      {errores.status}
                    </div>
                  )}
                </div>

                {/* Campos del formulario en grid responsive */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  
                  {/* Nombre */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                      <UserIcon className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
                      Nombre Completo *
                    </label>
                    <div className="relative">
                      <input
                        name="nombre"
                        type="text"
                        placeholder="Ingresa el nombre completo"
                        className={`w-full px-4 py-3 pl-12 border-2 rounded-xl focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                          errores.nombre 
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-100 dark:focus:ring-red-900/30' 
                            : 'border-gray-200 dark:border-gray-600'
                        }`}
                        value={form.nombre}
                        onChange={handleChange}
                      />
                      <UserIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                    {errores.nombre && (
                      <div className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                        <div className="w-1 h-1 bg-red-500 rounded-full mr-2"></div>
                        {errores.nombre}
                      </div>
                    )}
                  </div>

                  {/* Teléfono */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                      <PhoneIcon className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
                      Teléfono *
                    </label>
                    <div className="relative">
                      <input
                        name="telefono"
                        type="tel"
                        placeholder="10 dígitos"
                        className={`w-full px-4 py-3 pl-12 border-2 rounded-xl focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                          errores.telefono 
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-100 dark:focus:ring-red-900/30' 
                            : 'border-gray-200 dark:border-gray-600'
                        }`}
                        value={form.telefono}
                        onChange={handleChange}
                      />
                      <PhoneIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                    {errores.telefono && (
                      <div className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                        <div className="w-1 h-1 bg-red-500 rounded-full mr-2"></div>
                        {errores.telefono}
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                      <EnvelopeIcon className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
                      Email
                    </label>
                    <div className="relative">
                      <input
                        name="email"
                        type="email"
                        placeholder="correo@ejemplo.com"
                        className={`w-full px-4 py-3 pl-12 border-2 rounded-xl focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                          errores.email 
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-100 dark:focus:ring-red-900/30' 
                            : 'border-gray-200 dark:border-gray-600'
                        }`}
                        value={form.email}
                        onChange={handleChange}
                      />
                      <EnvelopeIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                    {errores.email && (
                      <div className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                        <div className="w-1 h-1 bg-red-500 rounded-full mr-2"></div>
                        {errores.email}
                      </div>
                    )}
                  </div>

                  {/* Identificación */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                      <IdentificationIcon className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
                      Identificación
                    </label>
                    <div className="relative">
                      <input
                        name="identification_number"
                        type="text"
                        placeholder="Número de identificación"
                        className="w-full px-4 py-3 pl-12 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        value={form.identification_number}
                        onChange={handleChange}
                      />
                      <IdentificationIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                  </div>

                  {/* Sexo */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                      <UserIcon className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
                      Sexo
                    </label>
                    <div className="relative">
                      <select
                        name="sexo"
                        className={`w-full px-4 py-3 pl-12 border-2 rounded-xl focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none ${
                          errores.sexo 
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-100 dark:focus:ring-red-900/30' 
                            : 'border-gray-200 dark:border-gray-600'
                        }`}
                        value={form.sexo}
                        onChange={handleChange}
                      >
                        <option value="">Seleccionar</option>
                        <option value="M">Masculino</option>
                        <option value="F">Femenino</option>
                      </select>
                      <UserIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    {errores.sexo && (
                      <div className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                        <div className="w-1 h-1 bg-red-500 rounded-full mr-2"></div>
                        {errores.sexo}
                      </div>
                    )}
                  </div>

                  {/* Dirección */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                      <MapPinIcon className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
                      Dirección
                    </label>
                    <div className="relative">
                      <input
                        name="direccion"
                        type="text"
                        placeholder="Dirección completa"
                        className={`w-full px-4 py-3 pl-12 border-2 rounded-xl focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                          errores.direccion 
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-100 dark:focus:ring-red-900/30' 
                            : 'border-gray-200 dark:border-gray-600'
                        }`}
                        value={form.direccion}
                        onChange={handleChange}
                      />
                      <MapPinIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                    {errores.direccion && (
                      <div className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                        <div className="w-1 h-1 bg-red-500 rounded-full mr-2"></div>
                        {errores.direccion}
                      </div>
                    )}
                  </div>

                  {/* Notas */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                      <DocumentTextIcon className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
                      Notas Adicionales
                    </label>
                    <div className="relative">
                      <textarea
                        name="notas"
                        placeholder="Información adicional sobre el cliente..."
                        className="w-full px-4 py-3 pl-12 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none min-h-[100px]"
                        value={form.notas}
                        onChange={handleChange}
                      />
                      <DocumentTextIcon className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer con botones modernos */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 px-6 py-6 sm:px-8 sm:py-8 border-t border-gray-200 dark:border-gray-600">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    console.log('ClienteModal - Botón Cancelar clickeado');
                    onClose();
                  }}
                  className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200 hover:scale-105 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-900/30"
                >
                  ❌ Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold transition-all duration-200 hover:scale-105 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Guardando...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      {cliente ? '✅ Actualizar Cliente' : '🚀 Crear Cliente'}
                    </div>
                  )}
                </button>
              </div>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 