import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getNegocioConfig, updateNegocioConfig, uploadNegocioLogo } from '../services/api';
import { NegocioConfig } from '../types';
import { FiX, FiUpload, FiFileText, FiPhone, FiMapPin, FiHome, FiDroplet } from 'react-icons/fi';
import ExpandableTextarea from './ExpandableTextarea';

interface InfoNegocioModalProps {
  open: boolean;
  onClose: () => void;
  color_personalizado?: string;
}

function validarTelefono(telefono: string) {
  return /^\d{10}$/.test(telefono);
}

function validarEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function InfoNegocioModal({ open, onClose, color_personalizado = '#2563eb' }: InfoNegocioModalProps) {
  const [negocioForm, setNegocioForm] = useState<NegocioConfig>({
    nombre_negocio: '',
    tipo_negocio: '',
    telefono: '',
    email: '',
    direccion: '',
    logo_url: '',
    color_personalizado: '#2563eb',
    nota_factura: '',
    terminos_condiciones: '',
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loadingLogo, setLoadingLogo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errores, setErrores] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (open) {
      getNegocioConfig().then(res => {
        setNegocioForm({
          ...negocioForm,
          ...res.data,
          color_personalizado: res.data.color_personalizado || '#2563eb',
        });
        setLogoPreview(res.data.logo_url || null);
      }).catch(() => {});
    }
    // eslint-disable-next-line
  }, [open]);

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      toast.error('Solo se permiten imágenes PNG o JPG');
      return;
    }
    if (file.size > 1024 * 1024) {
      toast.error('El logo no debe superar 1MB');
      return;
    }
    setLogoPreview(URL.createObjectURL(file));
    setLoadingLogo(true);
    try {
      const res = await uploadNegocioLogo(file);
      setNegocioForm({ ...negocioForm, logo_url: res.data.url });
      toast.success('Logo subido correctamente');
    } catch {
      toast.error('Error al subir el logo');
    } finally {
      setLoadingLogo(false);
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNegocioForm({ ...negocioForm, color_personalizado: e.target.value });
  };

  const handleHexInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (!value.startsWith('#')) value = '#' + value;
    setNegocioForm({ ...negocioForm, color_personalizado: value });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNegocioForm({ ...negocioForm, [name]: value });
    setErrores({ ...errores, [name]: '' });
  };

  const validarFormulario = () => {
    const nuevosErrores: { [key: string]: string } = {};
    if (!negocioForm.nombre_negocio.trim()) {
      nuevosErrores.nombre_negocio = 'El nombre del negocio es obligatorio.';
    } else if (negocioForm.nombre_negocio.trim().length < 2) {
      nuevosErrores.nombre_negocio = 'El nombre debe tener al menos 2 caracteres.';
    }
    if (!negocioForm.tipo_negocio.trim()) {
      nuevosErrores.tipo_negocio = 'El tipo de negocio es obligatorio.';
    } else if (negocioForm.tipo_negocio.trim().length < 2) {
      nuevosErrores.tipo_negocio = 'El tipo de negocio debe tener al menos 2 caracteres.';
    }
    if (!negocioForm.telefono) {
      nuevosErrores.telefono = 'El teléfono es obligatorio.';
    } else if (!validarTelefono(negocioForm.telefono)) {
      nuevosErrores.telefono = 'El teléfono debe tener exactamente 10 dígitos sin espacios. Ejemplo: 9392283101';
    }
    if (!negocioForm.email) {
      nuevosErrores.email = 'El email es obligatorio.';
    } else if (!validarEmail(negocioForm.email)) {
      nuevosErrores.email = 'Ingresa un email válido.';
    }
    if (!negocioForm.direccion.trim()) {
      nuevosErrores.direccion = 'La dirección es obligatoria.';
    } else if (negocioForm.direccion.trim().length < 3) {
      nuevosErrores.direccion = 'La dirección debe tener al menos 3 caracteres.';
    }
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validarFormulario()) {
      toast.error('Corrige los errores antes de guardar');
      return;
    }
    setLoading(true);
    try {
      await updateNegocioConfig(negocioForm);
      toast.success('Configuración de negocio guardada');
      onClose();
    } catch (error) {
      toast.error('Error al guardar la configuración');
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[99999] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-2 pt-2 pb-16 text-center sm:block sm:p-0 sm:px-4">
        <div className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75" onClick={onClose}></div>

        <div className="relative mx-auto w-full max-w-2xl p-4 my-4 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-2xl rounded-3xl sm:p-6 sm:my-8 flex flex-col max-h-[92vh] sm:max-h-[95vh] md:max-h-[98vh]">
          {/* Header moderno */}
          <div className="flex items-center justify-between mb-4 sm:mb-6 flex-shrink-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${color_personalizado}, ${color_personalizado}dd)` }}>
                <FiHome className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
                  Información del Negocio
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Configura los datos de tu negocio
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              <FiX className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>

          {/* Contenido principal */}
          <div className="overflow-y-auto flex-1 min-h-0">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Logo del negocio */}
              <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <FiUpload className="h-4 w-4 text-blue-500" />
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm sm:text-base">Logo del Negocio</h4>
                </div>
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white dark:bg-gray-700 flex items-center justify-center overflow-hidden border-2 border-gray-200 dark:border-gray-600 shadow-lg">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="object-contain w-full h-full" />
                    ) : (
                      <div className="text-gray-400 text-center">
                        <FiUpload className="h-4 w-4 sm:h-6 sm:w-6 mx-auto mb-1" />
                        <span className="text-xs">Sin logo</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-3 text-white rounded-xl cursor-pointer transition-colors font-medium text-xs sm:text-sm"
                      style={{ backgroundColor: color_personalizado }}
                    >
                      <FiUpload className="h-3 w-3 sm:h-4 sm:w-4" />
                      {loadingLogo ? 'Subiendo...' : 'Subir logo'}
                      <input type="file" accept="image/png,image/jpeg,image/jpg" className="hidden" onChange={handleLogoChange} disabled={loadingLogo} />
                    </label>
                    <p className="text-xs mt-2" style={{ color: color_personalizado }}>PNG/JPG, máx 1MB</p>
                  </div>
                </div>
              </div>

              {/* Color principal */}
              <div className="p-3 sm:p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <FiDroplet className="h-4 w-4 text-purple-500" />
                  <h4 className="font-semibold text-purple-900 dark:text-purple-100 text-sm sm:text-base">Color Principal</h4>
                </div>
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="relative">
                    <input 
                      type="color" 
                      value={negocioForm.color_personalizado || '#2563eb'} 
                      onChange={handleColorChange} 
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl border-2 border-gray-200 dark:border-gray-600 cursor-pointer" 
                    />
                    <div className="absolute inset-0 rounded-xl border-2 border-white dark:border-gray-800 pointer-events-none"></div>
                  </div>
                  <div className="flex-1">
                    <input 
                      type="text" 
                      value={negocioForm.color_personalizado || ''} 
                      onChange={handleHexInput} 
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none transition-colors font-mono text-xs sm:text-sm"
                      style={{ borderColor: negocioForm.color_personalizado ? color_personalizado : undefined }} 
                      maxLength={7} 
                      placeholder="#2563eb"
                    />
                    <p className="text-xs mt-2" style={{ color: color_personalizado }}>Ejemplo: #2563eb</p>
                  </div>
                </div>
              </div>

              {/* Información básica */}
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <FiHome className="h-4 w-4 inline mr-2" style={{ color: color_personalizado }} />
                    Nombre del Negocio *
                  </label>
                  <input
                    type="text"
                    name="nombre_negocio"
                    placeholder="Ej: Tu Guía Digital"
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none transition-colors text-sm ${
                      errores.nombre_negocio 
                        ? 'border-red-500 focus:border-red-500' 
                        : 'border-gray-200 dark:border-gray-600 focus:border-blue-500'
                    }`}
                    value={negocioForm.nombre_negocio}
                    onChange={handleChange}
                    required
                  />
                  {errores.nombre_negocio && (
                    <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                      <span>⚠️</span> {errores.nombre_negocio}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <FiHome className="h-4 w-4 inline mr-2 text-green-500" />
                    Tipo de Negocio *
                  </label>
                  <input
                    type="text"
                    name="tipo_negocio"
                    placeholder="Ej: Cursos Online, Consultoría, etc."
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none transition-colors text-sm ${
                      errores.tipo_negocio 
                        ? 'border-red-500 focus:border-red-500' 
                        : 'border-gray-200 dark:border-gray-600 focus:border-green-500'
                    }`}
                    value={negocioForm.tipo_negocio}
                    onChange={handleChange}
                    required
                  />
                  {errores.tipo_negocio && (
                    <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                      <span>⚠️</span> {errores.tipo_negocio}
                    </p>
                  )}
                </div>
              </div>

              {/* Información de contacto */}
              <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-2xl">
                <h4 className="font-semibold text-green-900 dark:text-green-100 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                  <FiPhone className="h-4 w-4" />
                  Información de Contacto
                </h4>
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Teléfono de WhatsApp *
                    </label>
                    <input
                      type="tel"
                      name="telefono"
                      placeholder="9392283101"
                      className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none transition-colors text-sm ${
                        errores.telefono 
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-gray-200 dark:border-gray-600 focus:border-green-500'
                      }`}
                      value={negocioForm.telefono}
                      onChange={handleChange}
                      required
                    />
                    {errores.telefono && (
                      <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                        <span>⚠️</span> {errores.telefono}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email del Negocio *
                    </label>
                    <input
                      type="email"
                      name="email"
                      placeholder="negocio@ejemplo.com"
                      className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none transition-colors text-sm ${
                        errores.email 
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-gray-200 dark:border-gray-600 focus:border-green-500'
                      }`}
                      value={negocioForm.email}
                      onChange={handleChange}
                      required
                    />
                    {errores.email && (
                      <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                        <span>⚠️</span> {errores.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <FiMapPin className="h-4 w-4 inline mr-2" />
                      Dirección *
                    </label>
                    <input
                      type="text"
                      name="direccion"
                      placeholder="Dirección completa del negocio"
                      className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none transition-colors text-sm ${
                        errores.direccion 
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-gray-200 dark:border-gray-600 focus:border-green-500'
                      }`}
                      value={negocioForm.direccion}
                      onChange={handleChange}
                      required
                    />
                    {errores.direccion && (
                      <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                        <span>⚠️</span> {errores.direccion}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Notas y términos expandibles */}
              <div className="space-y-4 sm:space-y-6">
                <ExpandableTextarea
                  label="Nota para Factura (Opcional)"
                  value={negocioForm.nota_factura || ''}
                  onChange={(value) => {
                    setNegocioForm({ ...negocioForm, nota_factura: value });
                    setErrores({ ...errores, nota_factura: '' });
                  }}
                  placeholder="Ej: Gracias por su compra, esperamos verlo pronto..."
                  icon={<FiFileText className="w-4 h-4 text-orange-500" />}
                  minHeight="min-h-[80px]"
                  maxHeight="max-h-[200px]"
                  expandedHeight="min-h-[300px]"
                />
                
                <ExpandableTextarea
                  label="Términos y Condiciones"
                  value={negocioForm.terminos_condiciones || ''}
                  onChange={(value) => {
                    setNegocioForm({ ...negocioForm, terminos_condiciones: value });
                    setErrores({ ...errores, terminos_condiciones: '' });
                  }}
                  placeholder="Términos y condiciones del negocio (opcional)"
                  icon={<FiFileText className="w-4 h-4 text-purple-500" />}
                  minHeight="min-h-[100px]"
                  maxHeight="max-h-[250px]"
                  expandedHeight="min-h-[400px]"
                />
              </div>
            </form>
          </div>

          {/* Botones fijos en la parte inferior */}
          <div className="bg-white dark:bg-gray-800 pt-3 sm:pt-4 mt-4 sm:mt-6 border-t border-gray-200 dark:border-gray-600 flex-shrink-0">
            <div className="flex gap-2 sm:gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-3 sm:px-6 py-2 sm:py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 px-3 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
              >
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 