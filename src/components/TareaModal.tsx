import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { DateTime } from 'luxon';

interface Cliente {
  id: string;
  nombre: string;
}

interface Tarea {
  id: string;
  descripcion: string;
  fecha_hora: string;
  cliente_id: string;
  estado: string;
  para_venta: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  tarea: Tarea | null;
  clientes: Cliente[];
}

export default function TareaModal({ open, onClose, onCreated, tarea, clientes }: Props) {
  const [form, setForm] = useState({
    descripcion: '',
    fecha_hora: '',
    cliente_id: '',
    para_venta: false,
  });
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [errores, setErrores] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (tarea) {
      setForm({
        descripcion: tarea.descripcion || '',
        fecha_hora: tarea.fecha_hora || '',
        cliente_id: tarea.cliente_id || '',
        para_venta: tarea.para_venta || false,
      });
      setDate(tarea.fecha_hora ? new Date(tarea.fecha_hora) : null);
    }
  }, [tarea]);

  useEffect(() => {
    if (open) {
      setForm({
        descripcion: tarea?.descripcion || '',
        fecha_hora: tarea?.fecha_hora || '',
        cliente_id: tarea?.cliente_id || '',
        para_venta: tarea?.para_venta || false,
      });
      setDate(tarea?.fecha_hora ? DateTime.fromISO(tarea.fecha_hora, { zone: 'utc' }).setZone('America/Puerto_Rico').toJSDate() : null);
      setErrores({});
    }
  }, [open, tarea]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setErrores({ ...errores, [name]: '' });
  };

  const handleDateChange = (date: Date | null) => {
    setDate(date);
    if (date) {
      const dt = DateTime.fromJSDate(date, { zone: 'America/Puerto_Rico' });
      setForm({ ...form, fecha_hora: dt.toUTC().toISO() ?? "" });
    } else {
      setForm({ ...form, fecha_hora: '' });
    }
    setErrores({ ...errores, fecha_hora: '' });
  };

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, para_venta: e.target.checked });
  };

  const validarFormulario = () => {
    const nuevosErrores: { [key: string]: string } = {};
    
    if (!form.descripcion.trim()) {
      nuevosErrores.descripcion = 'La descripción es obligatoria.';
    } else if (form.descripcion.trim().length < 3) {
      nuevosErrores.descripcion = 'La descripción debe tener al menos 3 caracteres.';
    }

    if (!form.fecha_hora) {
      nuevosErrores.fecha_hora = 'Selecciona una fecha y hora.';
    } else {
      // Convertir ambas fechas a la zona de Puerto Rico usando Luxon
      const ahoraPR = DateTime.now().setZone('America/Puerto_Rico');
      const fechaSeleccionadaPR = DateTime.fromISO(form.fecha_hora, { zone: 'utc' }).setZone('America/Puerto_Rico');
      if (fechaSeleccionadaPR < ahoraPR) {
        nuevosErrores.fecha_hora = 'La fecha y hora no pueden ser anteriores a la actual en Puerto Rico.';
      }
    }

    if (!form.cliente_id) {
      nuevosErrores.cliente_id = 'Selecciona un cliente.';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarFormulario()) {
      toast.error('Corrige los errores antes de guardar');
      return;
    }

    setLoading(true);
    try {
      if (tarea) {
        await api.put(`/api/tareas/${tarea.id}`, form);
        toast.success('Tarea actualizada');
      } else {
        await api.post('/api/tareas', form);
        toast.success('Tarea creada');
      }
      onCreated();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar la tarea');
    } finally {
      setLoading(false);
    }
  };

  const clientesFiltrados = clientes.filter((c: Cliente) =>
    c.nombre.toLowerCase().includes(search.toLowerCase())
  );

  const handleClienteSelect = (cliente: Cliente) => {
    setForm({ ...form, cliente_id: cliente.id });
    setShowDropdown(false);
    setSearch('');
    setErrores({ ...errores, cliente_id: '' });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-4 w-full max-w-xs mx-2">
        <h2 className="text-xl font-bold mb-4 text-center">{tarea ? 'Editar tarea' : 'Nueva tarea'}</h2>
        
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Descripción de la tarea</label>
         
          <input
            name="descripcion"
            type="text"
            placeholder="Ej: Llamar al cliente para seguimiento"
            className={`w-full mb-1 px-3 py-2 border rounded focus:outline-none ${errores.descripcion ? 'border-red-500' : ''}`}
            value={form.descripcion}
            onChange={handleChange}
            required
          />
          {errores.descripcion && <div className="text-xs text-red-600 mb-2">{errores.descripcion}</div>}
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-semibold">Fecha y hora</label>
          
          <DatePicker
            selected={date}
            onChange={handleDateChange}
            showTimeSelect
            timeFormat="hh:mm aa"
            timeIntervals={15}
            dateFormat="Pp"
            placeholderText="Selecciona fecha y hora"
            className={`w-full px-3 py-2 border rounded focus:outline-none ${errores.fecha_hora ? 'border-red-500' : ''}`}
            calendarClassName="!z-50"
            popperPlacement="bottom"
            minDate={new Date()}
            timeCaption="Hora"
            locale="es"
            withPortal={typeof window !== 'undefined' && window.innerWidth < 640}
            renderCustomHeader={({ date, decreaseMonth, increaseMonth, prevMonthButtonDisabled, nextMonthButtonDisabled }) => (
              <div className="flex justify-between items-center px-2 py-1">
                <button onClick={decreaseMonth} disabled={prevMonthButtonDisabled} type="button">‹</button>
                <span className="font-semibold">{date.toLocaleString('es-PR', { month: 'long', year: 'numeric' })}</span>
                <button onClick={increaseMonth} disabled={nextMonthButtonDisabled} type="button">›</button>
              </div>
            )}
          />
          {errores.fecha_hora && <div className="text-xs text-red-600 mb-2">{errores.fecha_hora}</div>}
          {showDatePicker && (
            <div className="flex justify-end mt-2">
              <button
                type="button"
                className="px-4 py-1 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                onClick={() => setShowDatePicker(false)}
              >
                Listo
              </button>
            </div>
          )}
        </div>
        <div className="mb-4 flex items-center gap-2">
          <label htmlFor="para_venta" className="font-semibold">¿Esta tarea es para una venta?</label>
          <input
            id="para_venta"
            type="checkbox"
            checked={form.para_venta}
            onChange={handleSwitchChange}
            className="accent-blue-600 w-5 h-5 rounded focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mb-4 relative">
          <label className="block mb-1 font-semibold">Selecciona un cliente</label>
          <div
            className={`w-full px-3 py-2 border rounded focus:outline-none bg-white cursor-pointer ${errores.cliente_id ? 'border-red-500' : ''}`}
            onClick={() => {
              setShowDropdown(!showDropdown);
              setTimeout(() => inputRef.current?.focus(), 100);
            }}
          >
            {form.cliente_id
              ? clientes.find((c) => c.id === form.cliente_id)?.nombre || 'Selecciona un cliente'
              : 'Selecciona un cliente'}
          </div>
          {errores.cliente_id && <div className="text-xs text-red-600 mb-2">{errores.cliente_id}</div>}
          {showDropdown && (
            <div className="absolute left-0 right-0 bg-white border rounded shadow-lg mt-1 z-10 max-h-48 overflow-auto">
              <input
                ref={inputRef}
                type="text"
                className="w-full px-3 py-2 border-b focus:outline-none"
                placeholder="Buscar cliente..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onClick={e => e.stopPropagation()}
              />
              {clientesFiltrados.length === 0 ? (
                <div className="px-3 py-2 text-gray-500">No hay clientes</div>
              ) : (
                clientesFiltrados.map((c) => (
                  <div
                    key={c.id}
                    className={`px-3 py-2 hover:bg-blue-100 cursor-pointer ${form.cliente_id === c.id ? 'bg-blue-50 font-semibold' : ''}`}
                    onClick={() => handleClienteSelect(c)}
                  >
                    {c.nombre}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            className="flex-1 py-2 rounded bg-gray-200 text-gray-700 font-semibold"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex-1 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
            disabled={loading}
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
} 