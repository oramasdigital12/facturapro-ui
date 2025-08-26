import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext, useLocation } from 'react-router-dom';
import { getFacturas } from '../services/api';
import { FiSearch, FiFileText, FiCalendar, FiX } from 'react-icons/fi';
import FacturaItem from '../components/FacturaItem';
import BotonCrear from '../components/BotonCrear';
import GestionFacturasEliminadasModal from '../components/GestionFacturasEliminadasModal';

const PAGE_SIZE = 10;

const estados = [
  { label: 'Todas', value: '', color: 'blue', icon: '📄' },
  { label: 'Pagadas', value: 'pagada', color: 'green', icon: '✅' },
  { label: 'Pendientes', value: 'pendiente', color: 'yellow', icon: '⏳' },
  { label: 'Por Vencer', value: 'por_vencer', color: 'orange', icon: '⚠️' },
  { label: 'Vencidas', value: 'vencida', color: 'red', icon: '🚨' },
  { label: 'Borradores', value: 'borrador', color: 'purple', icon: '📝' },
];

export default function Facturas() {
  const [loading, setLoading] = useState(false);
  const [facturas, setFacturas] = useState<any[]>([]);
  const [todasLasFacturas, setTodasLasFacturas] = useState<any[]>([]); // Estado para todas las facturas sin filtrar
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [, setTotalFacturas] = useState(0);
  const [mostrarFiltrosFecha, setMostrarFiltrosFecha] = useState(false);
  const [showPapeleraModal, setShowPapeleraModal] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const outletContext = useOutletContext() as { color_personalizado?: string } | null;
  const color_personalizado = outletContext?.color_personalizado || '#2563eb';

  // Leer parámetros de la URL al cargar
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const estadoParam = searchParams.get('estado');
    if (estadoParam) {
      setEstado(estadoParam);
    }
  }, [location.search]);

  // Efecto para cargar todas las facturas para los contadores
  useEffect(() => {
    fetchTodasLasFacturas();
  }, []);

  // Efecto para manejar la primera carga cuando se obtienen todas las facturas
  useEffect(() => {
    if (todasLasFacturas.length > 0 && facturas.length === 0 && !busqueda && !estado && !fechaDesde && !fechaHasta) {
      setFacturas(todasLasFacturas);
    }
  }, [todasLasFacturas, facturas.length, busqueda, estado, fechaDesde, fechaHasta]);

  useEffect(() => {
    // Solo hacer fetch si hay filtros aplicados o si es la primera carga
    if (busqueda || estado || fechaDesde || fechaHasta || page > 1) {
      fetchFacturas();
    }
    // eslint-disable-next-line
  }, [busqueda, estado, fechaDesde, fechaHasta, page]);

  // Función para cargar todas las facturas para los contadores
  const fetchTodasLasFacturas = async () => {
    try {
      const res = await getFacturas({});
      const facturasData = res.data.facturas || res.data || [];
      setTodasLasFacturas(facturasData);
    } catch (err: any) {
      console.error('Error al cargar todas las facturas para contadores:', err);
    }
  };

  const fetchFacturas = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      // Si es un refresh forzado o no hay filtros, cargar todas las facturas
      const needAllData = forceRefresh || estado === '' || ['por_vencer', 'vencida'].includes(estado);
      
      const params: any = needAllData ? {} : { page, limit: PAGE_SIZE };
      if (busqueda) params.q = busqueda;
      
      // Solo enviar estado a la API si es un estado real de la base de datos
      if (estado && !['por_vencer', 'vencida'].includes(estado)) {
        params.estado = estado;
      }
      
      if (fechaDesde) params.fecha_inicio = fechaDesde;
      if (fechaHasta) params.fecha_fin = fechaHasta;
      
      const res = await getFacturas(params);
      const facturasData = res.data.facturas || res.data || [];
      
      setFacturas(facturasData);
      setTotalFacturas(res.data.total || (res.data.facturas ? res.data.facturas.length : res.data.length));
      
      // Calcular paginación correctamente
      if (needAllData) {
        // Para filtros especiales, calcular páginas después del filtrado
        const totalFiltered = getFilteredCount(facturasData);
        setTotalPages(Math.ceil(totalFiltered / PAGE_SIZE));
      } else {
        setTotalPages(res.data.totalPages || Math.ceil((res.data.total || res.data.length || 1) / PAGE_SIZE));
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar facturas');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) setPage(newPage);
  };

  // Funciones para calcular estado de vencimiento
  const calcularDiasHastaVencimiento = (fechaVencimiento: string) => {
    if (!fechaVencimiento) return null;
    const hoy = new Date();
    const vencimiento = new Date(fechaVencimiento);
    hoy.setHours(0, 0, 0, 0);
    vencimiento.setHours(0, 0, 0, 0);
    const diferencia = Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    return diferencia;
  };

  const esFacturaPorVencer = (factura: any) => {
    if (factura.estado !== 'pendiente' || !factura.fecha_vencimiento) return false;
    const dias = calcularDiasHastaVencimiento(factura.fecha_vencimiento);
    return dias !== null && dias >= 0 && dias <= 3;
  };

  const esFacturaVencida = (factura: any) => {
    if (factura.estado !== 'pendiente' || !factura.fecha_vencimiento) return false;
    const dias = calcularDiasHastaVencimiento(factura.fecha_vencimiento);
    return dias !== null && dias < 0;
  };

  const filtrarPorNombre = (factura: any) => {
    if (!busqueda.trim()) return true;
    
    // Obtener nombre del cliente (maneja clientes eliminados)
    let nombreCliente = '';
    if (factura.cliente && factura.cliente.nombre) {
      nombreCliente = factura.cliente.nombre.trim().toLowerCase();
    } else {
      nombreCliente = 'cliente eliminado'; // Para búsquedas de clientes eliminados
    }
    
    return nombreCliente.startsWith(busqueda.trim().toLowerCase());
  };

  // Función para contar facturas filtradas
  const getFilteredCount = (facturasData: any[]) => {
    return facturasData
      .filter(filtrarPorNombre)
      .filter(factura => {
        if (!estado) return true;
        if (estado === 'por_vencer') return esFacturaPorVencer(factura);
        if (estado === 'vencida') return esFacturaVencida(factura);
        return factura.estado === estado;
      }).length;
  };

  // Funciones para obtener facturas filtradas según el estado de vencimiento
  const getFacturasFiltradas = () => {
    const filtered = facturas
      .filter(filtrarPorNombre)
      .filter(factura => {
        if (!estado) return true;
        if (estado === 'por_vencer') return esFacturaPorVencer(factura);
        if (estado === 'vencida') return esFacturaVencida(factura);
        return factura.estado === estado;
      });

    // Para filtros especiales, aplicar paginación manual
    const needAllData = estado === '' || ['por_vencer', 'vencida'].includes(estado);
    if (needAllData) {
      const startIndex = (page - 1) * PAGE_SIZE;
      const endIndex = startIndex + PAGE_SIZE;
      return filtered.slice(startIndex, endIndex);
    }

    return filtered;
  };

  // Calcular contadores basados en todas las facturas disponibles (sin filtrar)
  const contadores = {
    '': todasLasFacturas.length,
    'pagada': todasLasFacturas.filter(f => f.estado === 'pagada').length,
    'pendiente': todasLasFacturas.filter(f => f.estado === 'pendiente').length,
    'por_vencer': todasLasFacturas.filter(f => esFacturaPorVencer(f)).length,
    'vencida': todasLasFacturas.filter(f => esFacturaVencida(f)).length,
    'borrador': todasLasFacturas.filter(f => f.estado === 'borrador').length,
  };

  // Función para actualizar contadores cuando cambian las facturas
  const actualizarContadores = async () => {
    try {
      await fetchTodasLasFacturas();
    } catch (error) {
      console.error('Error al actualizar contadores:', error);
    }
  };

  // Función para limpiar filtros de fecha
  const limpiarFiltrosFecha = () => {
    setFechaDesde('');
    setFechaHasta('');
    setPage(1);
  };

  // Función para obtener el texto del rango de fechas
  const getRangoFechasTexto = () => {
    if (!fechaDesde && !fechaHasta) return '';
    if (fechaDesde && fechaHasta) {
      return `${fechaDesde} - ${fechaHasta}`;
    }
    if (fechaDesde) {
      return `Desde ${fechaDesde}`;
    }
    if (fechaHasta) {
      return `Hasta ${fechaHasta}`;
    }
    return '';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col md:items-center md:justify-center md:max-w-3xl md:mx-auto md:px-8 md:pl-28">
      {/* Wave decoration */}
      <div className="absolute inset-x-0 top-0 -z-10">
        <svg className="w-full h-48" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <defs>
            <linearGradient id="wave-gradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
          <path
            fill="url(#wave-gradient)"
            d="M0,96L48,112C96,128,192,160,288,186.7C384,213,480,235,576,218.7C672,203,768,149,864,128C960,107,1056,117,1152,128C1248,139,1344,149,1392,154.7L1440,160L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
          />
        </svg>
      </div>

      <div className="relative flex-1 flex flex-col px-3 sm:px-4 pb-24">
        <div className="text-center mb-4 mt-4 md:mb-8 md:mt-8">
          <h1 className="text-xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Facturas</h1>
          <div className="w-16 h-1 mx-auto rounded-full" style={{ background: color_personalizado }}></div>
        </div>

        <div className="flex flex-col gap-2 md:gap-4 mb-4 md:mb-6">
          {/* Búsqueda moderna */}
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                         <input
               type="text"
               placeholder="Buscar por nombre de cliente..."
               className="w-full pl-12 pr-4 py-2.5 md:py-4 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-white dark:bg-gray-800 shadow-lg text-gray-900 dark:text-gray-100 text-sm md:text-base"
               value={busqueda}
               onChange={e => { setBusqueda(e.target.value); setPage(1); }}
             />
          </div>

          {/* Filtros modernos - Responsive sin scroll horizontal */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 md:gap-3">
            {estados.map(est => (
              <button
                key={est.value}
                className={`flex flex-col items-center px-2 md:px-4 py-3 md:py-4 rounded-xl border-2 transition-all duration-300 focus:outline-none transform hover:scale-105 ${
                  estado === est.value 
                    ? `border-${est.color}-500 bg-${est.color}-50 text-${est.color}-700 shadow-lg` 
                    : `border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-${est.color}-400 hover:text-${est.color}-600 hover:shadow-md`
                }`}
                onClick={() => { setEstado(est.value); setPage(1); }}
              >
                <span className="text-base md:text-lg mb-1">{est.icon}</span>
                <span className="text-xs font-semibold text-center leading-tight">{est.label}</span>
                <span className={`text-xs md:text-sm font-bold mt-1 ${
                  est.color === 'blue' ? 'text-blue-600' :
                  est.color === 'green' ? 'text-green-600' :
                  est.color === 'yellow' ? 'text-yellow-600' :
                  est.color === 'orange' ? 'text-orange-600' :
                  est.color === 'red' ? 'text-red-600' :
                  'text-purple-600'
                }`}>
                  {contadores[est.value as keyof typeof contadores]}
                </span>
              </button>
            ))}
          </div>

                     {/* Botones para mostrar/ocultar filtros de fecha y papelera (móvil) */}
           <div className="flex justify-center gap-3">
             <button
               onClick={() => setMostrarFiltrosFecha(!mostrarFiltrosFecha)}
               className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-xl font-semibold shadow-lg transition-all duration-300 text-sm md:text-base ${
                 mostrarFiltrosFecha 
                   ? 'bg-blue-600 text-white hover:bg-blue-700' 
                   : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
               }`}
             >
               <FiCalendar className="w-4 h-4" />
               {mostrarFiltrosFecha ? 'Ocultar Filtros de Fecha' : 'Mostrar Filtros de Fecha'}
               {getRangoFechasTexto() && (
                 <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-xs">
                   {getRangoFechasTexto()}
                 </span>
               )}
             </button>
             
             {/* Botón de papelera para móvil */}
             <button
               onClick={() => setShowPapeleraModal(true)}
               className="md:hidden flex items-center gap-2 px-4 py-2 md:py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold shadow-lg transition-all duration-300 text-sm md:text-base transform hover:scale-105"
               title="Papelera"
             >
               <span className="text-lg">🗑️</span>
               <span className="hidden sm:inline">Papelera</span>
             </button>
           </div>

          {/* Filtros de fecha - Diseño moderno */}
          {mostrarFiltrosFecha && (
            <div className="overflow-hidden transition-all duration-300 ease-in-out">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 md:p-6 border border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <FiCalendar className="h-5 w-5 text-blue-500" />
                    Filtros de Fecha
                  </h3>
                  {(fechaDesde || fechaHasta) && (
                    <button
                      onClick={limpiarFiltrosFecha}
                      className="flex items-center gap-2 px-3 py-1 text-sm bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <FiX className="h-3 w-3" />
                      Limpiar
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Fecha Desde
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={fechaDesde}
                        onChange={e => { setFechaDesde(e.target.value); setPage(1); }}
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none transition-colors"
                      />
                      {fechaDesde && (
                        <button
                          onClick={() => { setFechaDesde(''); setPage(1); }}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <FiX className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Fecha Hasta
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={fechaHasta}
                        onChange={e => { setFechaHasta(e.target.value); setPage(1); }}
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none transition-colors"
                      />
                      {fechaHasta && (
                        <button
                          onClick={() => { setFechaHasta(''); setPage(1); }}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <FiX className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Información adicional */}
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    💡 <strong>Tip:</strong> Deja ambos campos vacíos para ver todas las facturas sin filtro de fecha.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Botones de acción para Desktop */}
        <div className="hidden md:flex justify-center gap-4 mb-6">
          <BotonCrear 
            onClick={() => navigate('/facturas/nueva')} 
            label="Nueva Factura"
            color_personalizado={color_personalizado}
            className="px-8 py-4 text-lg"
          />
          <button
            onClick={() => setShowPapeleraModal(true)}
            className="px-6 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
          >
            <span className="text-xl">🗑️</span>
            Papelera
          </button>
        </div>

        {/* Lista de facturas */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Cargando facturas...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500">{error}</p>
            </div>
          ) : getFacturasFiltradas().length === 0 ? (
            <div className="text-center py-8">
              <FiFileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No hay facturas
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {busqueda || estado || fechaDesde || fechaHasta 
                  ? 'No se encontraron facturas con los filtros aplicados'
                  : 'Crea tu primera factura para comenzar'
                }
              </p>
              {!busqueda && !estado && !fechaDesde && !fechaHasta && (
                <button
                  onClick={() => navigate('/facturas/nueva')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                >
                  Crear Factura
                </button>
              )}
            </div>
          ) : (
            <>
              {getFacturasFiltradas()
                .sort((a, b) => {
                  // Solo aplicar ordenamiento personalizado para el filtro "Todas"
                  if (estado === '') {
                    const aVencida = esFacturaVencida(a);
                    const bVencida = esFacturaVencida(b);
                    const aPorVencer = esFacturaPorVencer(a);
                    const bPorVencer = esFacturaPorVencer(b);

                    // 1. Vencidas primero (prioridad máxima)
                    if (aVencida && !bVencida) return -1;
                    if (!aVencida && bVencida) return 1;

                    // 2. Luego Por Vencer (prioridad media)
                    if (aPorVencer && !bPorVencer) return -1;
                    if (!aPorVencer && bPorVencer) return 1;

                    // 3. Para el resto, ordenar por fecha de creación descendente (más recientes primero)
                    const dateA = new Date(a.created_at || a.fecha_factura || 0);
                    const dateB = new Date(b.created_at || b.fecha_factura || 0);
                    return dateB.getTime() - dateA.getTime();
                  }
                  return 0; // No aplicar ordenamiento personalizado para otros filtros
                })
                .map((factura) => (
                <FacturaItem
                  key={factura.id}
                  factura={factura}
                  onChange={() => {
                    // Siempre recargar todas las facturas y contadores
                    fetchTodasLasFacturas();
                    fetchFacturas(true); // Forzar refresh
                    actualizarContadores();
                  }}
                  color_personalizado={color_personalizado}
                  calcularDiasHastaVencimiento={calcularDiasHastaVencimiento}
                />
              ))}
              
              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <span className="px-4 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl font-medium">
                    Página {page} de {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

             {/* Botón flotante para crear factura */}
       <div className="fixed bottom-28 right-4 z-50">
         <BotonCrear 
           onClick={() => navigate('/facturas/nueva')} 
           size="fab"
           color_personalizado={color_personalizado}
         />
       </div>

      {/* Modal de Gestión de Facturas Eliminadas */}
      <GestionFacturasEliminadasModal
        open={showPapeleraModal}
        onClose={() => setShowPapeleraModal(false)}
        onFacturaRestaurada={() => {
          fetchFacturas();
          actualizarContadores();
        }}
      />
    </div>
  );
} 