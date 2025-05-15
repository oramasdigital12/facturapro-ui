import React, { useState, useEffect } from 'react';
import { ArrowRightOnRectangleIcon, MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { useDarkMode } from '../contexts/AuthContext';
import { FiSettings } from 'react-icons/fi';
import InfoNegocioModal from '../components/InfoNegocioModal';

const Configuracion: React.FC = () => {
  const { dark, setDark } = useDarkMode();
  const [showInfoModal, setShowInfoModal] = useState(false);

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

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
      <div className="flex flex-col items-center justify-center flex-1 gap-8 py-8">
        {/* Card tipo Home para Info Negocio */}
        <button
          onClick={() => setShowInfoModal(true)}
          className="aspect-square bg-white dark:bg-gray-800 rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col items-center justify-center w-48 h-48 text-center border-2 border-transparent hover:border-blue-400 group"
        >
          <FiSettings className="h-12 w-12 text-gray-400 group-hover:text-blue-500 mb-2 transition-colors duration-300" />
          <span className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">Info. Negocio</span>
          <span className="text-xs text-blue-500 dark:text-blue-300">Editar datos del negocio</span>
        </button>
        {/* Aquí se pueden agregar más cards en el futuro */}
      </div>
      <InfoNegocioModal open={showInfoModal} onClose={() => setShowInfoModal(false)} />
    </div>
  );
};

export default Configuracion; 