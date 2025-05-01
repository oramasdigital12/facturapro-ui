import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  cliente?: any | null;
}

function calcularCategoria(pendiente: boolean, desde: string, hasta: string): string {
  if (pendiente) return 'pendiente';
  if (!desde || !hasta) return '';
  const hoy = new Date();
  const desdeDate = new Date(desde);
  const hastaDate = new Date(hasta);
  if (hastaDate < hoy) return 'Vencido';
  if (desdeDate > hoy) return 'por_vencer';
  if (desdeDate <= hoy && hastaDate >= hoy) return 'activo';
  return '';
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

// Función para calcular la edad a partir de la fecha de nacimiento
function calcularEdad(fecha: string) {
  if (!fecha) return '';
  const hoy = new Date();
  const nacimiento = new Date(fecha);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const m = hoy.getMonth() - nacimiento.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad >= 0 ? edad : '';
}

function esFechaValida(fecha: string) {
  // Valida formato y existencia real de la fecha YYYY-MM-DD y que no sea futura
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const [y, m, d] = fecha.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() + 1 !== m || date.getUTCDate() !== d) return false;
  const hoy = new Date();
  const hoyUTC = new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()));
  if (date > hoyUTC) return false;
  return true;
}

export default function ClienteModal({ open, onClose, onCreated, cliente }: Props) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    email: '',
    sexo: '',
    fecha_nacimiento: '',
    fecha_inicio: '',
    fecha_vencimiento: '',
    direccion: '',
    notas: '',
  });
  const [pendiente, setPendiente] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errores, setErrores] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (cliente) {
      setForm({
        nombre: cliente.nombre || '',
        telefono: cliente.telefono || '',
        email: cliente.email || '',
        sexo: cliente.sexo || '',
        fecha_nacimiento: cliente.fecha_nacimiento || '',
        fecha_inicio: cliente.fecha_inicio || '',
        fecha_vencimiento: cliente.fecha_vencimiento || '',
        direccion: cliente.direccion || '',
        notas: cliente.notas || '',
      });
      setPendiente(cliente.categoria === 'pendiente');
    } else {
      setForm({
        nombre: '',
        telefono: '',
        email: '',
        sexo: '',
        fecha_nacimiento: '',
        fecha_inicio: '',
        fecha_vencimiento: '',
        direccion: '',
        notas: '',
      });
      setPendiente(false);
    }
    setErrores({});
  }, [cliente, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrores({ ...errores, [e.target.name]: '' });
  };

  const handleFechaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrores({ ...errores, fecha: '' });
  };

  const handlePendienteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPendiente(e.target.checked);
    if (e.target.checked) {
      setForm({ ...form, fecha_nacimiento: '', fecha_vencimiento: '' });
      setErrores({ ...errores, fecha: '' });
    } else {
      // Si las fechas son 9999-12-31, poner la fecha actual
      const hoy = new Date();
      const hoyStr = hoy.toISOString().split('T')[0];
      setForm({
        ...form,
        fecha_inicio: form.fecha_inicio === '9999-12-31' ? hoyStr : form.fecha_inicio,
        fecha_vencimiento: form.fecha_vencimiento === '9999-12-31' ? hoyStr : form.fecha_vencimiento,
      });
    }
  };

  const categoria = calcularCategoria(
    pendiente,
    form.fecha_inicio,
    form.fecha_vencimiento
  );

  const validarFormulario = () => {
    const nuevosErrores: { [key: string]: string } = {};
    if (!validarNombre(form.nombre)) {
      nuevosErrores.nombre = 'El nombre debe tener al menos 2 letras y solo puede contener letras y espacios.';
    }
    if (!validarTelefono(form.telefono)) {
      nuevosErrores.telefono = 'El teléfono debe tener exactamente 10 dígitos.';
    }
    if (!validarEmail(form.email)) {
      nuevosErrores.email = 'Ingresa un email válido.';
    }
    if (!form.sexo || form.sexo.trim().length < 1) {
      nuevosErrores.sexo = 'El sexo es obligatorio.';
    }
    if (!form.fecha_nacimiento || !esFechaValida(form.fecha_nacimiento)) {
      nuevosErrores.fecha_nacimiento = 'La fecha de nacimiento debe ser válida y tener el formato YYYY-MM-DD.';
    }
    if (!form.direccion || form.direccion.trim().length < 3) {
      nuevosErrores.direccion = 'La dirección es obligatoria (mínimo 3 caracteres).';
    }
    if (!pendiente) {
      if (!form.fecha_inicio || !form.fecha_vencimiento) {
        nuevosErrores.fecha = 'Selecciona ambas fechas.';
      } else if (isNaN(Date.parse(form.fecha_inicio)) || isNaN(Date.parse(form.fecha_vencimiento))) {
        nuevosErrores.fecha = 'Las fechas deben ser válidas.';
      } else if (form.fecha_vencimiento < form.fecha_inicio) {
        nuevosErrores.fecha = 'La fecha "Hasta" debe ser igual o posterior a la fecha "Desde".';
      }
    }
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Usuario no autenticado');
      return;
    }
    if (!validarFormulario()) {
      toast.error('Corrige los errores antes de guardar');
      return;
    }
    setLoading(true);
    try {
      const data = {
        ...form,
        categoria,
        user_id: user.id,
        fecha_inicio: pendiente ? '9999-12-31' : form.fecha_inicio,
        fecha_vencimiento: pendiente ? '9999-12-31' : form.fecha_vencimiento,
      };
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md flex flex-col max-h-[80vh] relative">
        <h2 className="text-xl font-bold mb-4 text-center text-gray-800">
          {cliente ? 'Editar Cliente' : 'Nuevo Cliente'}
        </h2>
        
        <div className="flex-1 overflow-y-auto mb-2">
          <div className="space-y-3 pr-2 pb-4">
            <div className="flex flex-col items-center mb-3">
              <label className="flex items-center gap-3 justify-center mb-2 select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={pendiente}
                  onChange={handlePendienteChange}
                  className="w-6 h-6 rounded-full border-2 border-green-500 focus:ring-2 focus:ring-green-400 bg-white appearance-none checked:bg-green-500 checked:border-green-600 transition-all cursor-pointer"
                  style={{ accentColor: pendiente ? '#22c55e' : '#d1d5db' }}
                />
                <span className={`text-lg font-semibold ${pendiente ? 'text-yellow-600' : 'text-gray-600'}`}>Pendiente</span>
              </label>
            </div>

            {!pendiente && (
              <>
                <div className="mb-1 text-sm text-yellow-600 font-medium text-center px-4">
                  Si no es un cliente pendiente, escoge las fechas de inicio y vencimiento para validar el status del cliente
                </div>
                <div className="flex flex-col md:flex-row gap-3 mb-3">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-1 text-gray-700">Desde</label>
                    <input
                      type="text"
                      name="fecha_inicio"
                      placeholder="yyyy-mm-dd"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 ${
                        errores.fecha ? 'border-red-500' : 'border-gray-300'
                      }`}
                      value={form.fecha_inicio}
                      onChange={handleFechaChange}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-1 text-gray-700">Hasta</label>
                    <input
                      type="text"
                      name="fecha_vencimiento"
                      placeholder="yyyy-mm-dd"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 ${
                        errores.fecha ? 'border-red-500' : 'border-gray-300'
                      }`}
                      value={form.fecha_vencimiento}
                      onChange={handleFechaChange}
                    />
                  </div>
                </div>
              </>
            )}
            {errores.fecha && <div className="text-sm text-red-600 mb-2 text-center">{errores.fecha}</div>}

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
              <label className="text-sm font-medium mb-1 text-gray-700">Fecha de nacimiento</label>
              <input
                name="fecha_nacimiento"
                type="text"
                placeholder="yyyy-mm-dd"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 ${
                  errores.fecha_nacimiento ? 'border-red-500' : 'border-gray-300'
                }`}
                value={form.fecha_nacimiento}
                onChange={handleFechaChange}
              />
              {errores.fecha_nacimiento && (
                <div className="text-sm text-red-600 mt-1">{errores.fecha_nacimiento}</div>
              )}
              {form.fecha_nacimiento && esFechaValida(form.fecha_nacimiento) && form.fecha_nacimiento !== '9999-12-31' && (
                <div className="text-sm text-gray-600 mt-1">
                  Edad: <span className="font-semibold">{calcularEdad(form.fecha_nacimiento)}</span>
                </div>
              )}
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

        <div className="bg-white flex gap-3">
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
    </div>
  );
} 