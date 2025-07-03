import { Dialog } from '@headlessui/react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getNegocioConfig, updateNegocioConfig, uploadNegocioLogo } from '../services/api';
import { NegocioConfig } from '../types';

interface InfoNegocioModalProps {
  open: boolean;
  onClose: () => void;
}

function validarTelefono(telefono: string) {
  return /^\d{10}$/.test(telefono);
}
function validarEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function InfoNegocioModal({ open, onClose }: InfoNegocioModalProps) {
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
      nuevosErrores.telefono = 'El teléfono debe tener exactamente 10 dígitos.';
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
      window.location.reload();
    } catch (error) {
      toast.error('Error al guardar la configuración');
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} className="relative z-[100]">
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4">
        <Dialog.Panel className="mx-auto max-w-lg w-full rounded-2xl bg-white p-0 shadow-lg relative flex flex-col max-h-[90vh]">
          <form className="flex flex-col flex-1 min-h-0" onSubmit={handleSubmit}>
            <div className="flex-1 min-h-0 overflow-y-auto px-6 pt-6 pb-4 bg-white">
              <h2 className="text-xl font-bold mb-4 text-center text-gray-800">Información del Negocio</h2>
              <div className="space-y-4">
                <div>
                  <label className="block mb-1 font-semibold">Logo del negocio</label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden border">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" className="object-contain w-full h-full" />
                      ) : (
                        <span className="text-gray-400 text-xs">Sin logo</span>
                      )}
                    </div>
                    <label className="px-3 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition text-sm font-medium">
                      {loadingLogo ? 'Subiendo...' : 'Subir logo'}
                      <input type="file" accept="image/png,image/jpeg,image/jpg" className="hidden" onChange={handleLogoChange} disabled={loadingLogo} />
                    </label>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">PNG/JPG, máx 1MB</div>
                </div>
                <div>
                  <label className="block mb-1 font-semibold">Color principal</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={negocioForm.color_personalizado || '#2563eb'} onChange={handleColorChange} className="w-10 h-10 rounded-lg border" />
                    <input type="text" value={negocioForm.color_personalizado || ''} onChange={handleHexInput} className="w-28 px-2 py-1 border rounded focus:outline-none" maxLength={7} />
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Ejemplo: #2563eb</div>
                </div>
                <div>
                  <label className="block mb-1 font-semibold">Nota para factura</label>
                  <textarea
                    name="nota_factura"
                    placeholder="Ejemplo: Gracias por su compra"
                    className="w-full px-3 py-2 border rounded focus:outline-none bg-white text-gray-900 min-h-[48px]"
                    value={negocioForm.nota_factura || ''}
                    onChange={handleChange}
                  />
                  <div className="text-xs text-gray-400 mt-1">Esta nota aparecerá en las facturas.</div>
                </div>
                <div>
                  <label className="block mb-1 font-semibold">Términos y condiciones</label>
                  <textarea
                    name="terminos_condiciones"
                    placeholder="Términos y condiciones del negocio"
                    className="w-full px-3 py-2 border rounded focus:outline-none bg-white text-gray-900 min-h-[64px]"
                    value={negocioForm.terminos_condiciones || ''}
                    onChange={handleChange}
                  />
                  <div className="text-xs text-gray-400 mt-1">Opcional. Puedes dejarlo vacío.</div>
                </div>
                <div>
                  <label className="block mb-1 font-semibold">Nombre del negocio</label>
                  <input
                    type="text"
                    name="nombre_negocio"
                    placeholder="Nombre del negocio"
                    className={`w-full px-3 py-2 border rounded focus:outline-none bg-white text-gray-900 ${errores.nombre_negocio ? 'border-red-500' : ''}`}
                    value={negocioForm.nombre_negocio}
                    onChange={handleChange}
                    required
                  />
                  {errores.nombre_negocio && <div className="text-xs text-red-600 mt-1">{errores.nombre_negocio}</div>}
                </div>
                <div>
                  <label className="block mb-1 font-semibold">Tipo de negocio</label>
                  <input
                    type="text"
                    name="tipo_negocio"
                    placeholder="Tipo de negocio"
                    className={`w-full px-3 py-2 border rounded focus:outline-none bg-white text-gray-900 ${errores.tipo_negocio ? 'border-red-500' : ''}`}
                    value={negocioForm.tipo_negocio}
                    onChange={handleChange}
                    required
                  />
                  {errores.tipo_negocio && <div className="text-xs text-red-600 mt-1">{errores.tipo_negocio}</div>}
                </div>
                <div>
                  <label className="block mb-1 font-semibold">Teléfono de WhatsApp</label>
                  <input
                    type="tel"
                    name="telefono"
                    placeholder="Teléfono de WhatsApp"
                    className={`w-full px-3 py-2 border rounded focus:outline-none bg-white text-gray-900 ${errores.telefono ? 'border-red-500' : ''}`}
                    value={negocioForm.telefono}
                    onChange={handleChange}
                    required
                  />
                  {errores.telefono && <div className="text-xs text-red-600 mt-1">{errores.telefono}</div>}
                </div>
                <div>
                  <label className="block mb-1 font-semibold">Email del negocio</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email del negocio"
                    className={`w-full px-3 py-2 border rounded focus:outline-none bg-white text-gray-900 ${errores.email ? 'border-red-500' : ''}`}
                    value={negocioForm.email}
                    onChange={handleChange}
                    required
                  />
                  {errores.email && <div className="text-xs text-red-600 mt-1">{errores.email}</div>}
                </div>
                <div>
                  <label className="block mb-1 font-semibold">Dirección</label>
                  <input
                    type="text"
                    name="direccion"
                    placeholder="Dirección"
                    className={`w-full px-3 py-2 border rounded focus:outline-none bg-white text-gray-900 ${errores.direccion ? 'border-red-500' : ''}`}
                    value={negocioForm.direccion}
                    onChange={handleChange}
                    required
                  />
                  {errores.direccion && <div className="text-xs text-red-600 mt-1">{errores.direccion}</div>}
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-4 border-t bg-gray-50 rounded-b-2xl">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
              >
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 