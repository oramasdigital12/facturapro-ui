import React, { useState, useEffect } from 'react';
import { FiSettings, FiLayers, FiDollarSign } from 'react-icons/fi';
import InfoNegocioModal from '../components/InfoNegocioModal';
import GestionCategoriasServiciosModal from '../components/GestionCategoriasServiciosModal';
import GestionMetodosPagoModal from '../components/GestionMetodosPagoModal';
import { useOutletContext } from 'react-router-dom';
import { useDarkMode } from '../contexts/AuthContext';

const Configuracion: React.FC = () => {
  const { dark } = useDarkMode();
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showGestionModal, setShowGestionModal] = useState(false);
  const [showMetodosPagoModal, setShowMetodosPagoModal] = useState(false);
  const outletContext = useOutletContext() as { color_personalizado?: string } | null;
  const color_personalizado = outletContext?.color_personalizado || '#2563eb';

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <div className="text-center mb-8 mt-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Configuración</h1>
        <div className="w-16 h-1 mx-auto rounded-full" style={{ background: color_personalizado }}></div>
      </div>
      <div className="flex flex-col md:flex-row items-center justify-center flex-1 gap-8 py-8 w-full">
        {/* Card tipo Home para Info Negocio */}
        <button
          onClick={() => setShowInfoModal(true)}
          className="aspect-square bg-white dark:bg-gray-800 rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col items-center justify-center w-48 h-48 text-center border-2 border-transparent group"
        >
          <FiSettings className="h-12 w-12 text-gray-400 mb-2 transition-colors duration-300" />
          <span className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">Info. Negocio</span>
          <span className="text-xs" style={{ color: color_personalizado }}>Editar datos del negocio</span>
        </button>
        {/* Card para Categorías y Servicios */}
        <button
          onClick={() => setShowGestionModal(true)}
          className="aspect-square bg-white dark:bg-gray-800 rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col items-center justify-center w-48 h-48 text-center border-2 border-transparent group"
        >
          <FiLayers className="h-12 w-12 text-gray-400 mb-2 transition-colors duration-300" />
          <span className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">Categorías y Servicios</span>
          <span className="text-xs" style={{ color: color_personalizado }}>Gestionar categorías y servicios</span>
        </button>
        {/* Card para Métodos de Pago */}
        <button
          onClick={() => setShowMetodosPagoModal(true)}
          className="aspect-square bg-white dark:bg-gray-800 rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col items-center justify-center w-48 h-48 text-center border-2 border-transparent group"
        >
          <FiDollarSign className="h-12 w-12 text-gray-400 mb-2 transition-colors duration-300" />
          <span className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">Métodos de Pago</span>
          <span className="text-xs" style={{ color: color_personalizado }}>Gestionar formas de pago</span>
        </button>
      </div>
      <InfoNegocioModal open={showInfoModal} onClose={() => setShowInfoModal(false)} />
      <GestionCategoriasServiciosModal open={showGestionModal} onClose={() => setShowGestionModal(false)} />
      <GestionMetodosPagoModal open={showMetodosPagoModal} onClose={() => setShowMetodosPagoModal(false)} />
    </div>
  );
};

export default Configuracion; 