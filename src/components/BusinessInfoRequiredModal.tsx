import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import InfoNegocioModal from './InfoNegocioModal';
import { FiAlertTriangle, FiSettings, FiCheckCircle } from 'react-icons/fi';

interface BusinessInfoRequiredModalProps {
  open: boolean;
  onComplete: () => void;
}

export default function BusinessInfoRequiredModal({ open, onComplete }: BusinessInfoRequiredModalProps) {
  const { checkBusinessInfoComplete } = useAuth();
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [checking, setChecking] = useState(false);
  // Usar un color por defecto si no hay contexto disponible
  const color_personalizado = '#3B82F6';

  useEffect(() => {
    if (open) {
      checkInfo();
    }
  }, [open]);

  const checkInfo = async () => {
    setChecking(true);
    try {
      const businessInfoCheck = await checkBusinessInfoComplete();
      if (businessInfoCheck.complete) {
        onComplete();
      } else {
        setMissingFields(businessInfoCheck.missingFields);
      }
    } catch (error) {
      console.error('Error checking business info:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleOpenConfig = () => {
    setShowInfoModal(true);
  };

  const handleConfigClose = () => {
    setShowInfoModal(false);
    // Verificar nuevamente después de cerrar el modal de configuración
    setTimeout(() => {
      checkInfo();
    }, 500);
  };

  if (!open) return null;

  return (
    <>
      {/* Overlay que bloquea toda la interfaz */}
      <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-md">
        <div className="flex items-center justify-center min-h-screen p-4">
          {/* Modal principal */}
          <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md mx-auto overflow-hidden border border-white/10">
            {/* Header con gradiente */}
            <div 
              className="px-8 py-6 text-center relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${color_personalizado}, ${color_personalizado}dd)`
              }}
            >
              {/* Elementos decorativos */}
              <div className="absolute top-0 left-0 w-20 h-20 bg-white/10 rounded-full -translate-x-10 -translate-y-10"></div>
              <div className="absolute bottom-0 right-0 w-16 h-16 bg-white/10 rounded-full translate-x-8 translate-y-8"></div>
              
              <div className="relative z-10">
                <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                  <FiAlertTriangle className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Configuración Requerida
                </h2>
                <p className="text-white/90 text-sm">
                  Completa tu información para continuar
                </p>
              </div>
            </div>

            {/* Contenido */}
            <div className="px-8 py-6">
              <div className="text-center mb-6">
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Para acceder a FacturaPro, debes completar la información requerida de tu negocio.
                </p>

                {/* Lista de campos faltantes */}
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-2xl p-4 mb-6">
                  <h3 className="font-semibold text-red-800 dark:text-red-200 mb-3 flex items-center justify-center gap-2">
                    <FiAlertTriangle className="h-4 w-4" />
                    Campos Faltantes
                  </h3>
                  <ul className="space-y-2">
                    {missingFields.map((field, index) => (
                      <li key={index} className="text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                        {field}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Nota sobre campos opcionales */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-2xl p-4 mb-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <FiCheckCircle className="h-4 w-4 text-blue-500" />
                    <span className="font-medium text-blue-800 dark:text-blue-200 text-sm">
                      Campos Opcionales
                    </span>
                  </div>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Los campos "Nota para Factura" y "Términos y Condiciones" son opcionales y puedes dejarlos vacíos.
                  </p>
                </div>
              </div>

              {/* Botón de acción */}
              <button
                onClick={handleOpenConfig}
                disabled={checking}
                className="w-full py-4 px-6 rounded-2xl font-semibold text-white transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                style={{
                  background: `linear-gradient(135deg, ${color_personalizado}, ${color_personalizado}dd)`
                }}
              >
                {checking ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Verificando...
                  </>
                ) : (
                  <>
                    <FiSettings className="h-5 w-5" />
                    Completar Información
                  </>
                )}
              </button>

              {/* Mensaje de seguridad */}
              <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4 leading-relaxed">
                🔒 Esta verificación garantiza la correcta configuración de tu negocio para generar facturas válidas.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de configuración */}
      {showInfoModal && (
        <InfoNegocioModal 
          open={showInfoModal} 
          onClose={handleConfigClose}
          color_personalizado={color_personalizado}
        />
      )}
    </>
  );
}
