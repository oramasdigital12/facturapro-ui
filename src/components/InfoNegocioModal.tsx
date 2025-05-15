import { Dialog } from '@headlessui/react';
import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

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
  const [negocioForm, setNegocioForm] = useState({
    nombre_negocio: '',
    tipo_negocio: '',
    telefono: '',
    email: '',
    direccion: ''
  });
  const [loading, setLoading] = useState(false);
  const [errores, setErrores] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (open) {
      api.get('/api/negocio-config').then(res => setNegocioForm(res.data)).catch(() => {});
    }
  }, [open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      await api.post('/api/negocio-config', negocioForm);
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
    <Dialog open={open} onClose={onClose} className="relative z-[100]">
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4">
        <Dialog.Panel className="mx-auto max-w-md w-full rounded-2xl bg-white p-0 shadow-lg relative flex flex-col max-h-[90vh]">
          <form className="flex flex-col flex-1 min-h-0" onSubmit={handleSubmit}>
            <div className="flex-1 min-h-0 overflow-y-auto px-6 pt-6 pb-4 bg-white">
              <h2 className="text-xl font-bold mb-4 text-center text-gray-800">Información del Negocio</h2>
              <div className="space-y-4">
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