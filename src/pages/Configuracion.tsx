import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import { ArrowRightOnRectangleIcon, MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { useDarkMode } from '../contexts/AuthContext';

function validarTelefono(telefono: string) {
  return /^\d{10}$/.test(telefono);
}

function validarEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const Configuracion: React.FC = () => {
  const [negocioForm, setNegocioForm] = useState({
    nombre_negocio: '',
    tipo_negocio: '',
    telefono: '',
    email: '',
    direccion: ''
  });
  const [loadingNegocio, setLoadingNegocio] = useState(false);
  const [errores, setErrores] = useState<{ [key: string]: string }>({});
  const { dark, setDark } = useDarkMode();

  useEffect(() => {
    async function cargarNegocio() {
      try {
        const res = await api.get('/api/negocio-config');
        setNegocioForm(res.data);
      } catch (e) {
        // Si no hay config, dejar vacío
      }
    }
    cargarNegocio();
  }, []);

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

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

  async function handleNegocioSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validarFormulario()) {
      toast.error('Corrige los errores antes de guardar');
      return;
    }
    setLoadingNegocio(true);
    try {
      await api.post('/api/negocio-config', negocioForm);
      toast.success('Configuración de negocio guardada');
    } catch (error) {
      toast.error('Error al guardar la configuración');
    } finally {
      setLoadingNegocio(false);
    }
  }

  const handleLogout = () => {
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-center flex-1 text-gray-800 dark:text-gray-100">Configuración</h1>
        <div className="absolute top-4 right-4 flex items-center gap-2 z-50">
          <button
            type="button"
            onClick={() => setDark(!dark)}
            className="p-2 rounded-xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer"
            title={dark ? 'Modo claro' : 'Modo oscuro'}
          >
            {dark ? (
              <SunIcon className="w-6 h-6 text-yellow-400 group-hover:text-yellow-500" />
            ) : (
              <MoonIcon className="w-6 h-6 text-gray-400 group-hover:text-blue-500" />
            )}
          </button>
          <button
            className="ml-2 p-2 rounded-full bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-600 dark:text-gray-200"
            title="Cerrar sesión"
            onClick={handleLogout}
          >
            <ArrowRightOnRectangleIcon className="h-7 w-7" />
          </button>
        </div>
      </div>
      <div className="max-w-lg mx-auto p-4 relative">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Información del Negocio
            </h3>
            <form onSubmit={handleNegocioSubmit} className="space-y-4">
              <div>
                <label className="block mb-1 font-semibold">Nombre del negocio</label>
                <input
                  type="text"
                  name="nombre_negocio"
                  placeholder="Nombre del negocio"
                  className={`w-full px-3 py-2 border rounded focus:outline-none ${errores.nombre_negocio ? 'border-red-500' : ''}`}
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
                  className={`w-full px-3 py-2 border rounded focus:outline-none ${errores.tipo_negocio ? 'border-red-500' : ''}`}
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
                  className={`w-full px-3 py-2 border rounded focus:outline-none ${errores.telefono ? 'border-red-500' : ''}`}
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
                  className={`w-full px-3 py-2 border rounded focus:outline-none ${errores.email ? 'border-red-500' : ''}`}
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
                  className={`w-full px-3 py-2 border rounded focus:outline-none ${errores.direccion ? 'border-red-500' : ''}`}
                  value={negocioForm.direccion}
                  onChange={handleChange}
                  required
                />
                {errores.direccion && <div className="text-xs text-red-600 mt-1">{errores.direccion}</div>}
              </div>
              <button
                type="submit"
                className="w-full py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                disabled={loadingNegocio}
              >
                {loadingNegocio ? 'Guardando...' : 'Guardar'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Configuracion; 