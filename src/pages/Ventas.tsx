import { useEffect, useState } from 'react';
import api from '../services/api';
import VentaModal from '../components/VentaModal';
import { FiPlus, FiSearch } from 'react-icons/fi';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Venta, Cliente } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { showDeleteConfirmation, showSuccessMessage } from '../utils/alerts';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useAuth, useDarkMode } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MoonIcon, SunIcon } from '@heroicons/react/24/solid';
import BotonCrear from '../components/BotonCrear';

export default function Ventas() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [desde, setDesde] = useState<Date | null>(null);
  const [hasta, setHasta] = useState<Date | null>(null);
  const [tipo, setTipo] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [ventaEditando, setVentaEditando] = useState<Venta | null>(null);
  const [preselectedClienteId, setPreselectedClienteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { dark, setDark } = useDarkMode();

  useEffect(() => {
    fetchVentas();
    fetchClientes();
    // Si viene de una tarea para venta, abrir modal con cliente preseleccionado
    const clienteId = localStorage.getItem('venta_cliente_id');
    if (clienteId) {
      setPreselectedClienteId(clienteId);
      setShowModal(true);
      localStorage.removeItem('venta_cliente_id');
    }
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    // eslint-disable-next-line
  }, []);

  const fetchVentas = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/ventas', { params: { page: 1, limit: 1000 } });
      console.log('Respuesta API ventas:', res.data);
      setVentas(res.data || []);
    } catch {
      setVentas([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchClientes = async () => {
    try {
      const res = await api.get('/api/clientes');
      setClientes(res.data);
    } catch {
      setClientes([]);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await showDeleteConfirmation('¿Seguro que deseas eliminar esta venta?');
    if (result.isConfirmed) {
      try {
        await api.delete(`/api/ventas/${id}`);
        showSuccessMessage('Venta eliminada con éxito');
        setVentas(ventas.filter(venta => venta.id !== id));
      } catch (error) {
        console.error('Error al eliminar la venta:', error);
      }
    }
  };

  // Función para comparar solo fechas (sin hora)
  function isSameOrAfter(date1: Date, date2: Date) {
    return date1.setHours(0,0,0,0) >= date2.setHours(0,0,0,0);
  }
  function isSameOrBefore(date1: Date, date2: Date) {
    return date1.setHours(0,0,0,0) <= date2.setHours(0,0,0,0);
  }

  // Filtro por nombre de cliente, tipo y fechas
  const ventasFiltradas = ventas.filter((v: Venta) => {
    const cliente = clientes.find(c => c.id === v.cliente_id);
    if (busqueda.trim()) {
      if (!cliente) return false;
      const primerNombre = cliente.nombre.trim().split(' ')[0].toLowerCase();
      if (!primerNombre.startsWith(busqueda.trim().toLowerCase())) return false;
    }
    if (tipo && v.tipo !== tipo) return false;
    if (desde && !isSameOrAfter(new Date(v.fecha), desde)) return false;
    if (hasta && !isSameOrBefore(new Date(v.fecha), hasta)) return false;
    return true;
  }).sort((a: Venta, b: Venta) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Totales globales (no filtrados)
  const totalMensual = ventas.filter((v: Venta) => v.tipo === 'mensual').reduce((acc, v) => acc + parseFloat(v.monto), 0);
  const totalVenta = ventas.filter((v: Venta) => v.tipo === 'venta').reduce((acc, v) => acc + parseFloat(v.monto), 0);

  // Totales filtrados (para mostrar si hay filtro de tipo)
  const totalMensualFiltrado = ventasFiltradas.filter((v: Venta) => v.tipo === 'mensual').reduce((acc, v) => acc + parseFloat(v.monto), 0);
  const totalVentaFiltrado = ventasFiltradas.filter((v: Venta) => v.tipo === 'venta').reduce((acc, v) => acc + parseFloat(v.monto), 0);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // Exportar a PDF
  const exportarPDF = () => {
    const doc = new jsPDF();
    let y = 15;
    doc.setFontSize(16);
    doc.text('Historial de ventas', 14, y);
    y += 8;
    if (desde) {
      doc.setFontSize(10);
      doc.text(`Desde: ${format(desde, 'yyyy-MM-dd')}`, 14, y);
      y += 6;
    }
    if (hasta) {
      doc.setFontSize(10);
      doc.text(`Hasta: ${format(hasta, 'yyyy-MM-dd')}`, 14, y);
      y += 6;
    }
    doc.setFontSize(10);
    doc.text(`Filtro: ${tipo === '' ? 'Ambos' : tipo === 'mensual' ? 'Mensual' : 'Venta'}`, 14, y);
    y += 8;
    doc.text(`Cantidad de registros: ${ventasFiltradas.length}`, 14, y);
    y += 6;
    let totalMensual = ventasFiltradas.filter(v => v.tipo === 'mensual').reduce((acc, v) => acc + parseFloat(v.monto), 0);
    let totalVenta = ventasFiltradas.filter(v => v.tipo === 'venta').reduce((acc, v) => acc + parseFloat(v.monto), 0);
    let resumen = '';
    if (tipo === '' || tipo === undefined) {
      resumen = `Total mensualidades: $${totalMensual.toFixed(2)}\nTotal ventas únicas: $${totalVenta.toFixed(2)}`;
    } else if (tipo === 'mensual') {
      resumen = `Total mensualidades: $${totalMensual.toFixed(2)}`;
    } else if (tipo === 'venta') {
      resumen = `Total ventas únicas: $${totalVenta.toFixed(2)}`;
    }
    autoTable(doc, {
      startY: y,
      head: [['Cliente', 'Monto', 'Fecha', 'Tipo']],
      body: ventasFiltradas.map(v => {
        const cliente = clientes.find(c => c.id === v.cliente_id);
        return [
          cliente?.nombre || 'Cliente',
          `$${parseFloat(v.monto).toFixed(2)}`,
          format(new Date(v.fecha), 'yyyy-MM-dd'),
          v.tipo === 'mensual' ? 'Mensualidad' : 'Venta única',
        ];
      }),
      didDrawPage: (data: any) => {
        doc.text(resumen, 14, data.cursor.y + 10);
      }
    });
    doc.save('historial_ventas.pdf');
  };

  // Exportar a Excel
  const exportarExcel = () => {
    const wsData = [
      ['Historial de ventas'],
      [],
    ];
    if (desde) wsData.push([`Desde: ${format(desde, 'yyyy-MM-dd')}`]);
    if (hasta) wsData.push([`Hasta: ${format(hasta, 'yyyy-MM-dd')}`]);
    wsData.push([`Filtro: ${tipo === '' ? 'Ambos' : tipo === 'mensual' ? 'Mensual' : 'Venta'}`]);
    wsData.push([`Cantidad de registros: ${ventasFiltradas.length}`]);
    wsData.push([]);
    wsData.push(['Cliente', 'Monto', 'Fecha', 'Tipo']);
    ventasFiltradas.forEach(v => {
      const cliente = clientes.find(c => c.id === v.cliente_id);
      wsData.push([
        cliente?.nombre || 'Cliente',
        `$${parseFloat(v.monto).toFixed(2)}`,
        format(new Date(v.fecha), 'yyyy-MM-dd'),
        v.tipo === 'mensual' ? 'Mensualidad' : 'Venta única',
      ]);
    });
    let totalMensual = ventasFiltradas.filter(v => v.tipo === 'mensual').reduce((acc, v) => acc + parseFloat(v.monto), 0);
    let totalVenta = ventasFiltradas.filter(v => v.tipo === 'venta').reduce((acc, v) => acc + parseFloat(v.monto), 0);
    if (tipo === '' || tipo === undefined) {
      wsData.push([]);
      wsData.push([`Total mensualidades: $${totalMensual.toFixed(2)}`]);
      wsData.push([`Total ventas únicas: $${totalVenta.toFixed(2)}`]);
    } else if (tipo === 'mensual') {
      wsData.push([]);
      wsData.push([`Total mensualidades: $${totalMensual.toFixed(2)}`]);
    } else if (tipo === 'venta') {
      wsData.push([]);
      wsData.push([`Total ventas únicas: $${totalVenta.toFixed(2)}`]);
    }
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ventas');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([excelBuffer], { type: 'application/octet-stream' }), 'historial_ventas.xlsx');
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

      {/* Logout y Dark mode button */}
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
          type="button"
          onClick={() => handleLogout()}
          className="p-2 rounded-xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer"
          title="Cerrar sesión"
        >
          <ArrowRightOnRectangleIcon className="w-6 h-6 text-gray-400 dark:text-gray-200 group-hover:text-blue-500" />
        </button>
      </div>

      <div className="relative flex-1 flex flex-col px-4 pb-24">
        <div className="text-center mb-8 mt-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Ventas</h1>
          <div className="w-24 h-1 bg-blue-500 mx-auto rounded-full"></div>
        </div>
        <div className="flex flex-col gap-4 mb-6">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por cliente..."
              className="w-full pl-10 pr-3 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </div>
          <div className="flex gap-2 items-center justify-between">
            <DatePicker
              selected={desde}
              onChange={(date: Date | null) => setDesde(date)}
              dateFormat="yyyy-MM-dd"
              placeholderText="Desde"
              className="px-4 py-3 border rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxDate={hasta || undefined}
              isClearable
            />
            <DatePicker
              selected={hasta}
              onChange={(date: Date | null) => setHasta(date)}
              dateFormat="yyyy-MM-dd"
              placeholderText="Hasta"
              className="px-4 py-3 border rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              minDate={desde || undefined}
              isClearable
            />
          </div>
          <div className="flex flex-wrap gap-2 mb-2 justify-center">
            <button
              className={`flex-1 min-w-[140px] max-w-[200px] flex items-center justify-center gap-2 px-3 py-3 rounded-xl border-2 border-blue-400 text-blue-700 font-semibold bg-white shadow-sm transition-all
                ${tipo === 'mensual' ? 'bg-blue-50 border-blue-600 text-blue-800' : ''}
              `}
              onClick={() => setTipo(tipo === 'mensual' ? '' : 'mensual')}
            >
              <span className="text-lg">💵</span>
              <span>Mensual</span>
              <span className="ml-2 font-bold text-blue-800">${(tipo === 'mensual' ? totalMensualFiltrado : totalMensual).toFixed(2)}</span>
            </button>
            <button
              className={`flex-1 min-w-[140px] max-w-[200px] flex items-center justify-center gap-2 px-3 py-3 rounded-xl border-2 border-green-400 text-green-700 font-semibold bg-white shadow-sm transition-all
                ${tipo === 'venta' ? 'bg-green-50 border-green-600 text-green-800' : ''}
              `}
              onClick={() => setTipo(tipo === 'venta' ? '' : 'venta')}
            >
              <span className="text-lg">🪙</span>
              <span>Venta</span>
              <span className="ml-2 font-bold text-green-800">${(tipo === 'venta' ? totalVentaFiltrado : totalVenta).toFixed(2)}</span>
            </button>
          </div>
          <div className="flex justify-center mb-4">
            <button
              className={`flex items-center justify-center gap-2 px-5 py-2 rounded-full border-2 font-semibold shadow-sm transition-all
                ${tipo === '' ? 'bg-blue-100 border-blue-400 text-blue-800' : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'}
              `}
              style={{ minWidth: 120 }}
              onClick={() => setTipo('')}
            >
              <span className="text-lg">📋</span>
              <span>Ambos</span>
            </button>
          </div>
        </div>

        {tipo && tipo !== '' && (
          <div className="flex items-center justify-between mb-4">
            <div className="text-center text-sm font-medium px-4 py-2 bg-gray-50 rounded-xl">
              Total {tipo === 'mensual' ? 'mensualidades' : 'ventas únicas'}: 
              <span className="text-blue-700 ml-2 font-semibold">${(tipo === 'mensual' ? totalMensualFiltrado : totalVentaFiltrado).toFixed(2)}</span>
            </div>
            <div className="flex gap-2 ml-2">
              <button
                onClick={exportarPDF}
                className="px-3 py-2 rounded-lg bg-white border border-blue-400 text-blue-700 font-semibold shadow-sm hover:bg-blue-50 transition"
                title="Exportar a PDF"
                type="button"
              >
                PDF
              </button>
              <button
                onClick={exportarExcel}
                className="px-3 py-2 rounded-lg bg-white border border-green-400 text-green-700 font-semibold shadow-sm hover:bg-green-50 transition"
                title="Exportar a Excel"
                type="button"
              >
                Excel
              </button>
            </div>
          </div>
        )}

        {/* Si no hay filtro, igual mostrar los botones debajo del total global */}
        {(!tipo || tipo === '') && (
          <div className="flex justify-end mb-4">
            <div className="flex gap-2">
              <button
                onClick={exportarPDF}
                className="px-3 py-2 rounded-lg bg-white border border-blue-400 text-blue-700 font-semibold shadow-sm hover:bg-blue-50 transition"
                title="Exportar a PDF"
                type="button"
              >
                PDF
              </button>
              <button
                onClick={exportarExcel}
                className="px-3 py-2 rounded-lg bg-white border border-green-400 text-green-700 font-semibold shadow-sm hover:bg-green-50 transition"
                title="Exportar a Excel"
                type="button"
              >
                Excel
              </button>
            </div>
          </div>
        )}

        {/* Botón crear venta arriba de la lista */}
        <div className="flex justify-start mb-4">
          <BotonCrear
            onClick={() => { setVentaEditando(null); setShowModal(true); }}
            label="Nueva Venta"
          />
        </div>

        {loading ? (
          <div className="text-center py-8">Cargando...</div>
        ) : ventasFiltradas.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No hay ventas.</div>
        ) : (
          <ul className="space-y-4">
            {ventasFiltradas.map((venta: Venta) => {
              const cliente = clientes.find(c => c.id === venta.cliente_id);
              return (
                <li key={venta.id} className="bg-white rounded-xl shadow-sm p-4 relative">
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button
                      onClick={() => { setVentaEditando(venta); setShowModal(true); }}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(venta.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="pr-24">
                    <h3 className="font-semibold text-lg text-gray-900">
                      {cliente?.nombre || 'Cliente no encontrado'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {format(new Date(venta.fecha), "d 'de' MMMM, yyyy", { locale: es })}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="font-medium text-gray-900">${parseFloat(venta.monto).toFixed(2)}</span>
                      <span className={`inline-block text-xs px-3 py-1 rounded-full ${
                        venta.tipo === 'mensual' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                      }`}>
                        {venta.tipo === 'mensual' ? 'Mensual' : 'Venta única'}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <VentaModal
          open={showModal}
          onClose={() => setShowModal(false)}
          onCreated={fetchVentas}
          venta={ventaEditando}
          clientes={clientes}
          preselectedClienteId={preselectedClienteId}
        />
      </div>
    </div>
  );
} 