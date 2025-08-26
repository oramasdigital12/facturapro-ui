import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';
import { useEffect, useState } from 'react';
import SidebarNav from './SidebarNav';

import api from '../services/api';
import MobileHeader from './MobileHeader';
import { ArrowRightOnRectangleIcon, MoonIcon, SunIcon } from '@heroicons/react/24/solid';
import { useDarkMode, useAuth } from '../contexts/AuthContext';
import { openWhatsApp } from '../utils/urls';
import BusinessInfoRequiredModal from './BusinessInfoRequiredModal';

export default function Layout() {
  const { checkBusinessInfoComplete } = useAuth();
  const [, setClientes] = useState([]);
  const [negocio, setNegocio] = useState({ nombre_negocio: '', email: '', logo_url: '', color_personalizado: '#2563eb' });
  const [configLoaded, setConfigLoaded] = useState(false);
  const { dark, setDark } = useDarkMode();
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [businessInfoComplete, setBusinessInfoComplete] = useState(true);
  // Estados de carga ya no son necesarios

  useEffect(() => {
    api.get('/api/clientes').then(res => setClientes(res.data));
    api.get('/api/negocio-config').then(res => {
      setNegocio(res.data);
      setConfigLoaded(true);
    });
    
    // Verificar información del negocio al cargar
    checkBusinessInfo();
  }, []);

  // Escuchar cambios en el color personalizado (cuando se vuelve de /configuracion)
  const location = useLocation();
  useEffect(() => {
    // Solo recargar la configuración si venimos de la página de configuración y ya se cargó inicialmente
    if (location.pathname === '/configuracion' && configLoaded) {
      api.get('/api/negocio-config').then(res => setNegocio(res.data));
    }
    // Verificar nuevamente la información del negocio al cambiar de página
    checkBusinessInfo();
  }, [location.pathname, configLoaded]);

  // Función para recargar configuración del negocio
  const reloadNegocioConfig = async () => {
    try {
      const res = await api.get('/api/negocio-config');
      setNegocio(res.data);
      setConfigLoaded(true);
    } catch (error) {
      console.error('Error reloading negocio config:', error);
    }
  };

  const checkBusinessInfo = async () => {
    try {
      const businessInfoCheck = await checkBusinessInfoComplete();
      setBusinessInfoComplete(businessInfoCheck.complete);
      setShowBusinessModal(!businessInfoCheck.complete);
    } catch (error) {
      console.error('Error checking business info:', error);
      setBusinessInfoComplete(false);
      setShowBusinessModal(true);
    }
  };

  const handleBusinessInfoComplete = () => {
    setBusinessInfoComplete(true);
    setShowBusinessModal(false);
    // Recargar la configuración del negocio después de completar
    reloadNegocioConfig();
  };

  const handleLogout = async () => {
    try {
      // Si tienes lógica de logout, ponla aquí
      window.location.href = '/login';
    } catch (error) {
      // Manejo de error
    }
  };

  const handlePreguntasWhatsApp = () => {
    const mensaje = '¡Hola! Tengo una pregunta sobre FacturaPro. ¿Me pueden ayudar?';
    openWhatsApp('9392283101', mensaje);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 md:flex md:flex-row">
      {/* Loading state mientras se carga la configuración */}
      {!configLoaded && (
        <div className="flex items-center justify-center min-h-screen w-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {/* Interfaz principal - solo visible si la información del negocio está completa */}
      {businessInfoComplete && configLoaded && (
        <>
          {configLoaded && (
            <SidebarNav
              className="hidden md:flex"
              logo_url={negocio.logo_url}
              nombre_negocio={negocio.nombre_negocio}
              color_personalizado={negocio.color_personalizado}
            />
          )}
          <div className="hidden md:flex fixed top-4 right-4 gap-2 z-50">
            <button
              type="button"
              onClick={handlePreguntasWhatsApp}
              className="p-2 rounded-xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer"
              title="¿Tienes preguntas? ¡Chatea con nosotros!"
            >
              <svg className="w-6 h-6 text-gray-400 group-hover:text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
              </svg>
            </button>
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
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer"
              title="Cerrar sesión"
            >
              <ArrowRightOnRectangleIcon className="w-6 h-6 text-gray-400 group-hover:text-blue-500" />
            </button>
          </div>
          <main className={`pb-16 flex flex-col items-center justify-center min-h-screen w-full px-0 ${configLoaded ? 'md:pl-64' : ''} md:pr-4 flex-1 overflow-y-auto`}>
            <MobileHeader logo_url={configLoaded ? negocio.logo_url : undefined} color_personalizado={negocio.color_personalizado}>
              <button
                type="button"
                onClick={handlePreguntasWhatsApp}
                className="p-2 rounded-xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer"
                title="¿Tienes preguntas? ¡Chatea con nosotros!"
              >
                <svg className="w-6 h-6 text-gray-400 group-hover:text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
                </svg>
              </button>
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
                type="button"
                onClick={handleLogout}
                className="p-2 rounded-xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer"
                title="Cerrar sesión"
              >
                <ArrowRightOnRectangleIcon className="w-6 h-6 text-gray-400 group-hover:text-blue-500" />
              </button>
            </MobileHeader>
            <Outlet context={{ 
              color_personalizado: negocio.color_personalizado,
              nombre_negocio: configLoaded ? negocio.nombre_negocio : ''
            }} />
          </main>
          <div className="md:hidden">
            <BottomNav color_personalizado={negocio.color_personalizado} />
          </div>
        </>
      )}

      {/* Modal de información del negocio requerida */}
      <BusinessInfoRequiredModal 
        open={showBusinessModal} 
        onComplete={handleBusinessInfoComplete}
      />
    </div>
  );
} 