import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { Dialog } from '@headlessui/react';

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
  const [status, setStatus] = useState<'pendiente' | 'activo' | ''>('');
  const [loading, setLoading] = useState(false);
  const [errores, setErrores] = useState<{ [key: string]: string }>({});

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
      setStatus(cliente.categoria === 'pendiente' ? 'pendiente' : 'activo');
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

    setLoading(true);
    try {
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
      toast.success('Cliente guardado');
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al guardar cliente');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} className="relative z-[200]">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4">
        <Dialog.Panel className="mx-auto max-w-md w-full rounded-xl bg-white p-0 shadow-lg relative flex flex-col max-h-[90vh]">
          <form className="flex flex-col flex-1 min-h-0" onSubmit={handleSubmit}>
            <div className="flex-1 min-h-0 overflow-y-auto px-6 pt-6 pb-4">
              <div className="space-y-3 pr-2 pb-4">
                <div className="flex flex-col items-center mb-3">
                  <div className="flex gap-6 justify-center mb-2 select-none">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={status === 'pendiente'}
                        onChange={() => setStatus('pendiente')}
                        className="w-5 h-5 rounded-full border-2 border-green-500 focus:ring-2 focus:ring-green-400 bg-white appearance-none checked:bg-green-500 checked:border-green-600 transition-all cursor-pointer"
                        style={{ accentColor: status === 'pendiente' ? '#22c55e' : '#d1d5db' }}
                      />
                      <span className={`text-lg font-semibold ${status === 'pendiente' ? 'text-yellow-600' : 'text-gray-600'}`}>Pendiente</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={status === 'activo'}
                        onChange={() => setStatus('activo')}
                        className="w-5 h-5 rounded-full border-2 border-blue-500 focus:ring-2 focus:ring-blue-400 bg-white appearance-none checked:bg-blue-500 checked:border-blue-600 transition-all cursor-pointer"
                        style={{ accentColor: status === 'activo' ? '#3b82f6' : '#d1d5db' }}
                      />
                      <span className={`text-lg font-semibold ${status === 'activo' ? 'text-blue-600' : 'text-gray-600'}`}>Activo</span>
                    </label>
                  </div>
                  {errores.status && <div className="text-sm text-red-600 mb-2 text-center">{errores.status}</div>}
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 text-gray-700">Nombre</label>
                  <input
                    name="nombre"
                    type="text"
                    placeholder="Nombre completo"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 ${
                      errores.nombre ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={form.nombre}
                    onChange={handleChange}
                  />
                  {errores.nombre && <div className="text-sm text-red-600 mt-1">{errores.nombre}</div>}
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 text-gray-700">Teléfono</label>
                  <input
                    name="telefono"
                    type="text"
                    placeholder="10 dígitos"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 ${
                      errores.telefono ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={form.telefono}
                    onChange={handleChange}
                  />
                  {errores.telefono && <div className="text-sm text-red-600 mt-1">{errores.telefono}</div>}
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 text-gray-700">Email</label>
                  <input
                    name="email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 ${
                      errores.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={form.email}
                    onChange={handleChange}
                  />
                  {errores.email && <div className="text-sm text-red-600 mt-1">{errores.email}</div>}
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 text-gray-700">Identificación</label>
                  <input
                    name="identification_number"
                    type="text"
                    placeholder="Número de identificación"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 border-gray-300"
                    value={form.identification_number}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 text-gray-700">Sexo</label>
                  <select
                    name="sexo"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 ${
                      errores.sexo ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={form.sexo}
                    onChange={handleChange}
                  >
                    <option value="">Seleccionar</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                  {errores.sexo && <div className="text-sm text-red-600 mt-1">{errores.sexo}</div>}
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 text-gray-700">Dirección</label>
                  <input
                    name="direccion"
                    type="text"
                    placeholder="Dirección completa"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 ${
                      errores.direccion ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={form.direccion}
                    onChange={handleChange}
                  />
                  {errores.direccion && <div className="text-sm text-red-600 mt-1">{errores.direccion}</div>}
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 text-gray-700">Notas</label>
                  <textarea
                    name="notas"
                    placeholder="Notas adicionales"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 min-h-[80px]"
                    value={form.notas}
                    onChange={handleChange}
                  />
                </div>
              </div>
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
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
              >
                {loading ? 'Guardando...' : cliente ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 