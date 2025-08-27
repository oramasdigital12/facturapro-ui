import React, { useState, useEffect } from 'react';
import { FiSettings, FiLayers, FiDollarSign, FiMessageSquare } from 'react-icons/fi';
import InfoNegocioModal from '../components/InfoNegocioModal';
import GestionCategoriasServiciosModal from '../components/GestionCategoriasServiciosModal';
import GestionMetodosPagoModal from '../components/GestionMetodosPagoModal';
import GestionMensajesPredefinidosFacturaModal from '../components/GestionMensajesPredefinidosFacturaModal';
import { useOutletContext } from 'react-router-dom';
import { useDarkMode } from '../contexts/AuthContext';

const Configuracion: React.FC = () => {
  const { dark } = useDarkMode();
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showGestionModal, setShowGestionModal] = useState(false);
  const [showMetodosPagoModal, setShowMetodosPagoModal] = useState(false);
  const [showMensajesPredefinidosModal, setShowMensajesPredefinidosModal] = useState(false);
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
      <div className="text-center mb-4 mt-4 md:mb-8 md:mt-8 px-4">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-3">Configuración</h1>
        <div className="w-16 sm:w-20 h-1 mx-auto rounded-full" style={{ background: color_personalizado }}></div>
      </div>
      
      <div className="flex-1 px-4 pb-6">
        <div className="grid grid-cols-2 gap-4 md:gap-6 max-w-2xl mx-auto">
          {/* Primera fila: Info Negocio y Categorías */}
                     <button
             onClick={() => setShowInfoModal(true)}
             className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-center p-4 h-36 sm:h-40 md:h-44 text-center border border-gray-200 dark:border-gray-700 group hover:scale-105"
           >
                         <FiSettings className="h-16 w-16 sm:h-18 sm:w-18 md:h-20 md:w-20 text-gray-500 dark:text-gray-400 mb-3 group-hover:text-blue-500 transition-colors duration-300" />
            <span className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">Info. Negocio</span>
            <span className="text-xs sm:text-sm" style={{ color: color_personalizado }}>Editar datos del negocio</span>
          </button>

                     <button
             onClick={() => setShowGestionModal(true)}
             className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-center p-4 h-36 sm:h-40 md:h-44 text-center border border-gray-200 dark:border-gray-700 group hover:scale-105"
           >
                         <FiLayers className="h-16 w-16 sm:h-18 sm:w-18 md:h-20 md:w-20 text-gray-500 dark:text-gray-400 mb-3 group-hover:text-green-500 transition-colors duration-300" />
            <span className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">Categorías y Servicios</span>
            <span className="text-xs sm:text-sm" style={{ color: color_personalizado }}>Gestionar categorías y servicios</span>
          </button>

          {/* Segunda fila: Métodos de Pago y Mensajes Predefinidos */}
                     <button
             onClick={() => setShowMetodosPagoModal(true)}
             className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-center p-4 h-36 sm:h-40 md:h-44 text-center border border-gray-200 dark:border-gray-700 group hover:scale-105"
           >
                         <FiDollarSign className="h-16 w-16 sm:h-18 sm:w-18 md:h-20 md:w-20 text-gray-500 dark:text-gray-400 mb-3 group-hover:text-green-500 transition-colors duration-300" />
            <span className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">Métodos de Pago</span>
            <span className="text-xs sm:text-sm" style={{ color: color_personalizado }}>Gestionar formas de pago</span>
          </button>

                     <button
             onClick={() => setShowMensajesPredefinidosModal(true)}
             className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-center p-4 h-36 sm:h-40 md:h-44 text-center border border-gray-200 dark:border-gray-700 group hover:scale-105"
           >
                         <FiMessageSquare className="h-16 w-16 sm:h-18 sm:w-18 md:h-20 md:w-20 text-gray-500 dark:text-gray-400 mb-3 group-hover:text-purple-500 transition-colors duration-300" />
            <span className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">Mensajes Predefinidos</span>
            <span className="text-xs sm:text-sm" style={{ color: color_personalizado }}>Gestionar mensajes de factura</span>
          </button>
        </div>
      </div>

      <InfoNegocioModal open={showInfoModal} onClose={() => setShowInfoModal(false)} color_personalizado={color_personalizado} />
      <GestionCategoriasServiciosModal open={showGestionModal} onClose={() => setShowGestionModal(false)} />
      <GestionMetodosPagoModal open={showMetodosPagoModal} onClose={() => setShowMetodosPagoModal(false)} color_personalizado={color_personalizado} />
      <GestionMensajesPredefinidosFacturaModal open={showMensajesPredefinidosModal} onClose={() => setShowMensajesPredefinidosModal(false)} />
    </div>
  );
};

export default Configuracion; 