import { useEffect, useState } from 'react';
import { getFacturas } from '../services/api';
import FacturaItem from '../components/FacturaItem';
import { useNavigate } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import BotonCrear from '../components/BotonCrear';
import { FiSearch, FiFileText, FiCalendar } from 'react-icons/fi';

const PAGE_SIZE = 10;

const estados = [
  { label: 'Todas', value: '', color: 'blue', icon: '📄' },
  { label: 'Pagadas', value: 'pagada', color: 'green', icon: '✅' },
  { label: 'Pendientes', value: 'pendiente', color: 'yellow', icon: '⏳' },
  { label: 'Borradores', value: 'borrador', color: 'purple', icon: '📝' },
];

export default function Facturas() {
  const [facturas, setFacturas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [, setTotalFacturas] = useState(0);
  const [mostrarFiltrosFecha, setMostrarFiltrosFecha] = useState(false);

  const navigate = useNavigate();
  const outletContext = useOutletContext() as { color_personalizado?: string } | null;
  const color_personalizado = outletContext?.color_personalizado || '#2563eb';

  // Validación de UUID
  const esUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id);

  useEffect(() => {
    fetchFacturas();
    // eslint-disable-next-line
  }, [busqueda, estado, fechaDesde, fechaHasta, page]);

  const fetchFacturas = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { page, limit: PAGE_SIZE };
      if (busqueda) params.q = busqueda;
      if (estado) params.estado = estado;
      if (fechaDesde) params.fecha_inicio = fechaDesde;
      if (fechaHasta) params.fecha_fin = fechaHasta;
      const res = await getFacturas(params);
      setFacturas(res.data.facturas || res.data || []);
      setTotalFacturas(res.data.total || (res.data.facturas ? res.data.facturas.length : res.data.length));
      setTotalPages(res.data.totalPages || Math.ceil((res.data.total || res.data.length || 1) / PAGE_SIZE));
    } catch (err: any) {
      setError(err.message || 'Error al cargar facturas');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) setPage(newPage);
  };

  const filtrarPorNombre = (factura: any) => {
    if (!busqueda.trim()) return true;
    const nombreCliente = factura.cliente?.nombre?.trim().toLowerCase() || '';
    return nombreCliente.startsWith(busqueda.trim().toLowerCase());
  };

  // Calcular contadores
  const contadores = {
    '': facturas.length,
    'pagada': facturas.filter(f => f.estado === 'pagada').length,
    'pendiente': facturas.filter(f => f.estado === 'pendiente').length,
    'borrador': facturas.filter(f => f.estado === 'borrador').length,
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

      <div className="relative flex-1 flex flex-col px-4 pb-24">
        <div className="text-center mb-6 mt-6 md:mb-8 md:mt-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Facturas</h1>
          <div className="w-16 h-1 mx-auto rounded-full" style={{ background: color_personalizado }}></div>
        </div>

        <div className="flex flex-col gap-3 md:gap-4 mb-4 md:mb-6">
          {/* Búsqueda moderna */}
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre de cliente..."
              className="w-full pl-12 pr-4 py-3 md:py-4 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-white dark:bg-gray-800 shadow-lg text-gray-900 dark:text-gray-100 text-sm md:text-base"
              value={busqueda}
              onChange={e => { setBusqueda(e.target.value); setPage(1); }}
            />
          </div>

          {/* Filtros modernos - Scroll horizontal en móvil */}
          <div className="overflow-x-auto pb-2 md:pb-0">
            <div className="flex gap-2 md:gap-3 justify-start md:justify-center min-w-max md:min-w-0">
              {estados.map(est => (
                <button
                  key={est.value}
                  className={`flex flex-col items-center px-4 md:px-6 py-3 md:py-4 rounded-2xl border-2 transition-all duration-300 min-w-[80px] md:min-w-[100px] flex-shrink-0 focus:outline-none transform hover:scale-105 ${
                    estado === est.value 
                      ? `border-${est.color}-500 bg-${est.color}-50 text-${est.color}-700 shadow-lg` 
                      : `border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-${est.color}-400 hover:text-${est.color}-600 hover:shadow-md`
                  }`}
                  onClick={() => { setEstado(est.value); setPage(1); }}
                >
                  <span className="text-xl md:text-2xl mb-1 md:mb-2">{est.icon}</span>
                  <span className="text-xs md:text-sm font-semibold text-center">{est.label}</span>
                  <span className={`text-sm md:text-lg font-bold mt-1 ${
                    est.color === 'blue' ? 'text-blue-600' :
                    est.color === 'green' ? 'text-green-600' :
                    est.color === 'yellow' ? 'text-yellow-600' :
                    'text-purple-600'
                  }`}>
                    {contadores[est.value as keyof typeof contadores]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Botón para mostrar/ocultar filtros de fecha */}
          <div className="flex justify-center">
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
          </div>

          {/* Filtros de fecha - Animación suave */}
          {mostrarFiltrosFecha && (
            <div className="overflow-hidden transition-all duration-300 ease-in-out">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 md:p-6 border border-gray-200 dark:border-gray-600">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-3 md:mb-4">
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 md:mb-2">
                      Fecha Desde
                    </label>
                    <input
                      type="date"
                      value={fechaDesde}
                      onChange={e => { setFechaDesde(e.target.value); setPage(1); }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-sm md:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 md:mb-2">
                      Fecha Hasta
                    </label>
                    <input
                      type="date"
                      value={fechaHasta}
                      onChange={e => { setFechaHasta(e.target.value); setPage(1); }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-sm md:text-base"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={limpiarFiltrosFecha}
                      className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm md:text-base"
                    >
                      Limpiar Fechas
                    </button>
                  </div>
                </div>
                
                {/* Información del rango seleccionado */}
                {getRangoFechasTexto() && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <FiCalendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                      Filtro activo: {getRangoFechasTexto()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Botón crear factura */}
          <div className="flex justify-between items-center mb-3 md:mb-4 gap-2">
            <div className="flex gap-2 items-center w-full justify-end">
              <div className="hidden md:block">
                <BotonCrear
                  onClick={() => navigate('/facturas/nueva')}
                  label="Nueva Factura"
                  color_personalizado={color_personalizado}
                  size="md"
                  className=""
                />
              </div>
            </div>
            {/* Botón flotante solo en móvil */}
            <div className="fixed bottom-20 right-4 z-50 md:hidden">
              <BotonCrear
                onClick={() => navigate('/facturas/nueva')}
                label=""
                color_personalizado={color_personalizado}
                size="fab"
                className=""
              />
            </div>
          </div>
        </div>

        {/* Lista de facturas */}
        {loading ? (
          <div className="text-center py-8 md:py-12">
            <div className="inline-block animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm md:text-base">Cargando facturas...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 md:py-12">
            <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <FiFileText className="w-8 h-8 md:w-10 md:h-10 text-red-500" />
            </div>
            <h3 className="text-base md:text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Error al cargar facturas
            </h3>
            <p className="text-red-600 dark:text-red-400 text-sm md:text-base">{error}</p>
          </div>
        ) : facturas.length === 0 ? (
          <div className="text-center py-8 md:py-12">
            <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <FiFileText className="w-8 h-8 md:w-10 md:h-10 text-gray-400" />
            </div>
            <h3 className="text-base md:text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
              No hay facturas
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm md:text-base">
              {busqueda ? 'No se encontraron facturas con ese cliente.' : 'Comienza creando tu primera factura.'}
            </p>
            {!busqueda && (
              <button
                onClick={() => navigate('/facturas/nueva')}
                className="px-4 md:px-6 py-2 md:py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 text-sm md:text-base"
                style={{ background: color_personalizado, color: 'white' }}
              >
                Crear Primera Factura
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {facturas.filter(f => esUUID(f.id) && filtrarPorNombre(f)).map(factura => (
              <FacturaItem key={factura.id} factura={factura} onChange={fetchFacturas} />
            ))}
          </div>
        )}

        {/* Paginación moderna */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 md:gap-3 mt-6 md:mt-8">
            <button 
              className="px-3 md:px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm md:text-base" 
              onClick={() => handlePageChange(page - 1)} 
              disabled={page === 1}
            >
              Anterior
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Página</span>
              <span className="px-2 md:px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg font-semibold text-sm md:text-base">
                {page}
              </span>
              <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400">de {totalPages}</span>
            </div>
            <button 
              className="px-3 md:px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm md:text-base" 
              onClick={() => handlePageChange(page + 1)} 
              disabled={page === totalPages}
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 