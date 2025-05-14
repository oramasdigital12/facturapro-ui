import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import Swal from 'sweetalert2';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  cliente?: any | null;
}

function calcularCategoria(pendiente: boolean, hasta: string): string {
  if (pendiente) return 'pendiente';
  if (!hasta) return '';
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const hastaDate = new Date(hasta);
  hastaDate.setHours(0, 0, 0, 0);
  const diffDias = Math.ceil((hastaDate.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDias < 0) return 'Vencido';
  if (diffDias <= 3) return 'por_vencer';
  return 'activo';
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
    identification_number: '',
    sexo: '',
    fecha_nacimiento: '',
    fecha_inicio: '',
    fecha_vencimiento: '',
    direccion: '',
    notas: '',
  });
  const [status, setStatus] = useState<'pendiente' | 'activo' | ''>('');
  const [loading, setLoading] = useState(false);
  const [errores, setErrores] = useState<{ [key: string]: string }>({});
  const [usarFechas, setUsarFechas] = useState(false);

  useEffect(() => {
    if (cliente) {
      setForm({
        nombre: cliente.nombre || '',
        telefono: cliente.telefono || '',
        email: cliente.email || '',
        identification_number: cliente.identification_number || '',
        sexo: cliente.sexo || '',
        fecha_nacimiento: cliente.fecha_nacimiento || '',
        fecha_inicio: cliente.fecha_inicio && cliente.fecha_inicio !== '9999-12-31' ? cliente.fecha_inicio : '',
        fecha_vencimiento: cliente.fecha_vencimiento && cliente.fecha_vencimiento !== '9999-12-31' ? cliente.fecha_vencimiento : '',
        direccion: cliente.direccion || '',
        notas: cliente.notas || '',
      });
      setStatus(cliente.categoria === 'pendiente' ? 'pendiente' : 'activo');
      setUsarFechas(!!(cliente.fecha_inicio && cliente.fecha_inicio !== '9999-12-31'));
    } else {
      setForm({
        nombre: '',
        telefono: '',
        email: '',
        identification_number: '',
        sexo: '',
        fecha_nacimiento: '',
        fecha_inicio: '',
        fecha_vencimiento: '',
        direccion: '',
        notas: '',
      });
      setStatus('');
      setUsarFechas(false);
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

  const validarFormulario = () => {
    const nuevosErrores: { [key: string]: string } = {};
    if (!status) {
      nuevosErrores.status = 'Debes seleccionar un status.';
    }
    if (!validarNombre(form.nombre)) {
      nuevosErrores.nombre = 'El nombre debe tener al menos 2 letras y solo puede contener letras y espacios.';
    }
    if (form.telefono && !validarTelefono(form.telefono)) {
      nuevosErrores.telefono = 'El teléfono debe tener exactamente 10 dígitos.';
    }
    if (form.email && !validarEmail(form.email)) {
      nuevosErrores.email = 'Ingresa un email válido.';
    }
    if (form.sexo && form.sexo.trim().length > 0 && !['M', 'F'].includes(form.sexo)) {
      nuevosErrores.sexo = 'El sexo debe ser Masculino (M) o Femenino (F).';
    }
    if (form.fecha_nacimiento && !esFechaValida(form.fecha_nacimiento)) {
      nuevosErrores.fecha_nacimiento = 'La fecha de nacimiento debe ser válida y tener el formato YYYY-MM-DD.';
    }
    if (form.direccion && form.direccion.trim().length > 0 && form.direccion.trim().length < 3) {
      nuevosErrores.direccion = 'La dirección debe tener al menos 3 caracteres.';
    }
    if (usarFechas) {
      if ((form.fecha_inicio && !form.fecha_vencimiento) || (!form.fecha_inicio && form.fecha_vencimiento)) {
        nuevosErrores.fecha = 'Si vas a ingresar fechas, selecciona ambas.';
      } else if (form.fecha_inicio && form.fecha_vencimiento) {
        if (isNaN(Date.parse(form.fecha_inicio)) || isNaN(Date.parse(form.fecha_vencimiento))) {
          nuevosErrores.fecha = 'Las fechas deben ser válidas.';
        } else if (form.fecha_vencimiento < form.fecha_inicio) {
          nuevosErrores.fecha = 'La fecha "Hasta" debe ser igual o posterior a la fecha "Desde".';
        }
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

    // Detectar campos importantes en blanco
    const camposFaltantes: string[] = [];
    const descripciones: string[] = [];
    if (!form.telefono) {
      camposFaltantes.push('Teléfono');
      descripciones.push('<b>Teléfono:</b> No podrás llamarlo ni enviarle mensajes de WhatsApp.');
    }
    if (!form.email) {
      camposFaltantes.push('Email');
      descripciones.push('<b>Email:</b> No podrás enviarle correos electrónicos.');
    }
    if (!form.fecha_nacimiento) {
      camposFaltantes.push('Fecha de nacimiento');
      descripciones.push('<b>Fecha de nacimiento:</b> No podrás felicitarlo en su cumpleaños.');
    }
    if (!form.identification_number) {
      camposFaltantes.push('Identificación');
      descripciones.push('<b>Identificación:</b> Sin número de identificación no podrás enviar emails automáticos a validaciones.');
    }

    if (camposFaltantes.length > 0 || !usarFechas) {
      let extra = '';
      if (!usarFechas) {
        extra = '<br><b>Fecha de Comienzo y Fecha de Vencimiento:</b> Si no seleccionas fechas, no podrás tener control de los clientes por vencer y no lo detectará en ese filtro.';
      }
      const { isConfirmed } = await Swal.fire({
        title: '¿Estás seguro que deseas guardar el cliente sin estos campos?',
        html: `<ul style='text-align:left;'>${camposFaltantes.map(c => `<li>• ${c}</li>`).join('')}</ul><div class='mt-2 text-sm text-gray-600'>${descripciones.join('<br>')}${extra}</div>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Guardar de todos modos',
        cancelButtonText: 'Cancelar',
        customClass: { htmlContainer: 'text-left' }
      });
      if (!isConfirmed) return;
    }

    setLoading(true);
    try {
      // Construir el objeto data solo con los campos llenados o null
      const data: any = {
        nombre: form.nombre,
        user_id: user.id,
        categoria: !usarFechas ? status : calcularCategoria(status === 'pendiente', form.fecha_vencimiento),
        fecha_inicio: usarFechas ? (form.fecha_inicio || '9999-12-31') : '9999-12-31',
        fecha_vencimiento: usarFechas ? (form.fecha_vencimiento || '9999-12-31') : '9999-12-31',
      };
      ['telefono', 'email', 'identification_number', 'sexo', 'fecha_nacimiento', 'direccion', 'notas'].forEach((campo) => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md flex flex-col max-h-[80vh] relative">
        <h2 className="text-xl font-bold mb-4 text-center text-gray-800">
          {cliente ? 'Editar Cliente' : 'Nuevo Cliente'}
        </h2>
        
        <div className="flex-1 overflow-y-auto mb-2">
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

            <div className="flex flex-col md:flex-row gap-3 mb-3 relative">
              <div className="w-full mb-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={usarFechas}
                  onChange={e => setUsarFechas(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-400 focus:ring-2 focus:ring-blue-400"
                  id="usarFechas"
                />
                <label htmlFor="usarFechas" className="text-sm text-gray-700 select-none cursor-pointer">Seleccionar fechas</label>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-1 text-gray-700">Fecha de Comienzo</label>
                <input
                  type="text"
                  name="fecha_inicio"
                  placeholder="yyyy-mm-dd"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 ${errores.fecha ? 'border-red-500' : 'border-gray-300'}`}
                  value={usarFechas ? form.fecha_inicio : ''}
                  onChange={handleFechaChange}
                  disabled={!usarFechas}
                />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-1 text-gray-700">Fecha de Vencimiento</label>
                <input
                  type="text"
                  name="fecha_vencimiento"
                  placeholder="yyyy-mm-dd"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 ${errores.fecha ? 'border-red-500' : 'border-gray-300'}`}
                  value={usarFechas ? form.fecha_vencimiento : ''}
                  onChange={handleFechaChange}
                  disabled={!usarFechas}
                />
              </div>
            </div>
            {errores.fecha && <div className="text-sm text-red-600 mb-2 text-center">{errores.fecha}</div>}

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