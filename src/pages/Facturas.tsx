import { useEffect, useState } from 'react';
import { getFacturas } from '../services/api';
import FacturaItem from '../components/FacturaItem';
import { useNavigate } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import BotonCrear from '../components/BotonCrear';

const PAGE_SIZE = 10;

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
  const [totalFacturas, setTotalFacturas] = useState(0);

  // Métricas
  const [totalFacturado, setTotalFacturado] = useState(0);
  const [totalPendiente, setTotalPendiente] = useState(0);
  const [totalPagadas, setTotalPagadas] = useState(0);

  const [mostrarFiltros, setMostrarFiltros] = useState(false);

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
      // Calcular métricas
      let total = 0, pendiente = 0, pagadas = 0;
      (res.data.facturas || res.data || []).forEach((f: any) => {
        total += f.total || 0;
        if (f.estado === 'pendiente') pendiente += f.total || 0;
        if (f.estado === 'pagada') pagadas += f.total || 0;
      });
      setTotalFacturado(total);
      setTotalPendiente(pendiente);
      setTotalPagadas(pagadas);
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col md:items-center md:justify-center md:max-w-3xl md:mx-auto md:px-8 md:pl-28">
      <div className="text-center mb-8 mt-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Facturas</h1>
        <div className="w-16 h-1 mx-auto rounded-full" style={{ background: color_personalizado }}></div>
      </div>
      {/* Métricas */}
      <div className="grid grid-cols-2 gap-2 mt-4 mb-4 px-1 md:grid-cols-4 md:gap-3 md:mt-8 md:mb-6 md:px-2">
        <div className="bg-white rounded-xl shadow p-2 flex flex-col items-center md:p-3">
          <span className="text-xl md:text-2xl">💰</span>
          <span className="text-[10px] md:text-xs text-gray-500">Total Facturado</span>
          <span className="font-bold text-base md:text-lg text-gray-800">${totalFacturado.toFixed(2)}</span>
        </div>
        <div className="bg-white rounded-xl shadow p-2 flex flex-col items-center md:p-3">
          <span className="text-xl md:text-2xl">📥</span>
          <span className="text-[10px] md:text-xs text-gray-500">Pendiente de Pago</span>
          <span className="font-bold text-base md:text-lg text-yellow-600">${totalPendiente.toFixed(2)}</span>
        </div>
        <div className="bg-white rounded-xl shadow p-2 flex flex-col items-center md:p-3">
          <span className="text-xl md:text-2xl">📤</span>
          <span className="text-[10px] md:text-xs text-gray-500">Pagadas</span>
          <span className="font-bold text-base md:text-lg text-green-600">${totalPagadas.toFixed(2)}</span>
        </div>
        <div className="bg-white rounded-xl shadow p-2 flex flex-col items-center md:p-3">
          <span className="text-xl md:text-2xl">📄</span>
          <span className="text-[10px] md:text-xs text-gray-500"># Facturas</span>
          <span className="font-bold text-base md:text-lg text-blue-600">{totalFacturas}</span>
        </div>
      </div>
      {/* Botón Filtro y panel de filtros */}
      <div className="flex flex-col gap-2 mb-3 px-1 md:flex-row md:gap-3 md:mb-4 md:px-2">
        <button
          className="w-full md:w-auto px-4 py-2 rounded-xl font-semibold shadow bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 flex items-center justify-center gap-2 transition-all duration-150 mb-2 md:mb-0"
          style={{ borderColor: color_personalizado, color: color_personalizado }}
          onClick={() => setMostrarFiltros(v => !v)}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707l-6.414 6.414A1 1 0 0013 13.414V19a1 1 0 01-1.447.894l-4-2A1 1 0 017 17v-3.586a1 1 0 00-.293-.707L3.293 6.707A1 1 0 013 6V4z" /></svg>
          Filtro
        </button>
        {mostrarFiltros && (
          <div className="flex flex-col md:flex-row gap-2 w-full items-center">
            <input
              type="text"
              placeholder="Buscar por nombre de cliente..."
              className="flex-1 min-w-[160px] max-w-xs px-3 py-2 rounded-xl border shadow-sm h-[42px] md:h-auto focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={busqueda}
              onChange={e => { setBusqueda(e.target.value); setPage(1); }}
              style={{ fontSize: '1rem' }}
            />
            <select className="px-3 py-2 rounded-xl border shadow-sm w-full md:w-auto h-[42px]" value={estado} onChange={e => { setEstado(e.target.value); setPage(1); }}>
              <option value="">Todos</option>
              <option value="pendiente">Pendientes</option>
              <option value="pagada">Pagadas</option>
              <option value="borrador">Borradores</option>
            </select>
            <input type="date" className="px-2 py-2 rounded-xl border shadow-sm w-full md:w-auto h-[42px]" value={fechaDesde} onChange={e => { setFechaDesde(e.target.value); setPage(1); }} />
            <input type="date" className="px-2 py-2 rounded-xl border shadow-sm w-full md:w-auto h-[42px]" value={fechaHasta} onChange={e => { setFechaHasta(e.target.value); setPage(1); }} />
          </div>
        )}
      </div>
      {/* Botón crear factura (desktop) */}
      <div className="hidden md:flex justify-end mb-4">
        <BotonCrear
          onClick={() => navigate('/facturas/nueva')}
          label="Nueva Factura"
          color_personalizado={color_personalizado}
          size="md"
        />
      </div>
      {/* Lista de facturas */}
      <div className="relative flex-1 flex flex-col px-4 pb-24">
        {loading && <div className="text-center py-8">Cargando...</div>}
        {error && <div className="text-center py-8 text-red-500">{error}</div>}
        {!loading && !error && facturas.length === 0 && <div className="text-center py-8 text-gray-500">No hay facturas.</div>}
        {!loading && !error && facturas.filter(f => esUUID(f.id) && filtrarPorNombre(f)).map(factura => (
          <FacturaItem key={factura.id} factura={factura} onChange={fetchFacturas} />
        ))}
      </div>
      {/* Paginación */}
      <div className="flex justify-center items-center gap-2 mb-8">
        <button className="px-3 py-1 rounded bg-gray-200 text-gray-700 font-semibold" onClick={() => handlePageChange(page - 1)} disabled={page === 1}>Anterior</button>
        <span className="text-sm">Página {page} de {totalPages}</span>
        <button className="px-3 py-1 rounded bg-gray-200 text-gray-700 font-semibold" onClick={() => handlePageChange(page + 1)} disabled={page === totalPages}>Siguiente</button>
      </div>
      {/* Botón flotante crear factura (móvil) */}
      <div className="fixed top-1/2 -translate-y-1/2 right-6 z-50 md:hidden">
        <BotonCrear
          onClick={() => navigate('/facturas/nueva')}
          label=""
          color_personalizado={color_personalizado}
          size="fab"
        />
      </div>
    </div>
  );
} 