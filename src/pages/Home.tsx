import { useAuth, useDarkMode } from '../contexts/AuthContext';
import { useOutletContext } from 'react-router-dom';
import api from '../services/api';
import { useState, useEffect } from 'react';
import ClienteModal from '../components/ClienteModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Home() {
  const { user } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [negocio, setNegocio] = useState({ nombre_negocio: '', email: '', logo_url: '' });
  const [clienteEditando, setClienteEditando] = useState<any>(null);
  const [showClienteModal, setShowClienteModal] = useState(false);
  const { dark } = useDarkMode();
  const outletContext = useOutletContext() as { color_personalizado?: string } | null;
  const color_personalizado = outletContext?.color_personalizado || '#2563eb';

  // Métricas de facturas
  const [totalFacturado, setTotalFacturado] = useState(0);
  const [totalPendiente, setTotalPendiente] = useState(0);
  const [totalPagadas, setTotalPagadas] = useState(0);
  const [totalFacturas, setTotalFacturas] = useState(0);
  const [cotizacionesPendientes, setCotizacionesPendientes] = useState(0);
  const [aPuntoDeVencer, setAPuntoDeVencer] = useState(0);

  // Filtros de fecha para métricas
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [showFiltrosFecha, setShowFiltrosFecha] = useState(false);

  // Estados para acciones de clientes
  const [clienteSeleccionado, setClienteSeleccionado] = useState<any>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailData, setEmailData] = useState({ titulo: '', descripcion: '' });

  useEffect(() => {
    fetchClientes();
    fetchNegocio();
    fetchMetricas();
  }, [fechaDesde, fechaHasta]);

  const fetchClientes = async () => {
    try {
      const res = await api.get('/api/clientes');
      setClientes(res.data);
    } catch (error) {
      console.error('Error fetching clientes:', error);
    }
  };

  const fetchNegocio = async () => {
    try {
      const res = await api.get('/api/negocio-config');
      setNegocio(res.data);
    } catch (error) {
      console.error('Error fetching negocio:', error);
    }
  };

  const fetchMetricas = async () => {
    try {
      const params: any = {};
      if (fechaDesde) params.fecha_inicio = fechaDesde;
      if (fechaHasta) params.fecha_fin = fechaHasta;
      
      const res = await api.get('/api/facturas', { params });
      const facturas = res.data.facturas || res.data || [];
      
      let total = 0, pendiente = 0, pagadas = 0, aVencer = 0;
      facturas.forEach((f: any) => {
        // Total facturado solo incluye las que se completaron el pago final
        if (f.estado === 'pagada') {
          total += f.total || 0;
          pagadas += f.total || 0;
        }
        if (f.estado === 'pendiente') {
          pendiente += f.total || 0;
          // Calcular facturas a punto de vencer (si tienen due_date)
          if (f.due_date) {
            const dueDate = new Date(f.due_date);
            const hoy = new Date();
            const diffDias = Math.ceil((dueDate.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDias <= 7 && diffDias >= 0) {
              aVencer++;
            }
          }
        }
      });
      
      setTotalFacturado(total);
      setTotalPendiente(pendiente);
      setTotalPagadas(pagadas);
      setTotalFacturas(facturas.length);
      setAPuntoDeVencer(aVencer);
      // Por ahora cotizaciones pendientes es 0, se implementará después
      setCotizacionesPendientes(0);
    } catch (error) {
      console.error('Error fetching métricas:', error);
    }
  };

  const handleEditCliente = (cliente: any) => {
    setClienteEditando(cliente);
    setShowClienteModal(true);
  };

  const handleCloseModal = () => {
    setShowClienteModal(false);
    setClienteEditando(null);
  };

  const handleLlamarCliente = (cliente: any) => {
    if (cliente.telefono) {
      window.open(`tel:${cliente.telefono}`, '_blank');
    } else {
      alert('Este cliente no tiene número de teléfono registrado');
    }
  };

  const handleEmailCliente = (cliente: any) => {
    if (cliente.email) {
      setClienteSeleccionado(cliente);
      setShowEmailModal(true);
    } else {
      const agregarEmail = confirm('Este cliente no tiene email registrado. ¿Deseas agregarle uno?');
      if (agregarEmail) {
        setClienteEditando(cliente);
        setShowClienteModal(true);
      }
    }
  };

  const handleWhatsappCliente = (cliente: any) => {
    if (cliente.telefono) {
      const mensaje = `Hola ${cliente.nombre}, soy ${negocio.nombre_negocio}. ¿Cómo estás?`;
      window.open(`https://wa.me/${cliente.telefono}?text=${encodeURIComponent(mensaje)}`, '_blank');
    } else {
      alert('Este cliente no tiene número de teléfono registrado');
    }
  };

  const handleEnviarEmail = async () => {
    if (!emailData.titulo || !emailData.descripcion) {
      alert('Por favor completa el título y descripción del email');
      return;
    }

    try {
      // Aquí iría la lógica para enviar el email
      console.log('Enviando email a:', clienteSeleccionado.email, emailData);
      alert('Email enviado correctamente');
      setShowEmailModal(false);
      setEmailData({ titulo: '', descripcion: '' });
      setClienteSeleccionado(null);
    } catch (error) {
      alert('Error al enviar el email');
    }
  };

  const getRangoFechasTexto = () => {
    if (!fechaDesde && !fechaHasta) return 'Este mes';
    if (fechaDesde && fechaHasta) {
      return `${format(new Date(fechaDesde), 'dd/MM/yyyy', { locale: es })} - ${format(new Date(fechaHasta), 'dd/MM/yyyy', { locale: es })}`;
    }
    if (fechaDesde) {
      return `Desde ${format(new Date(fechaDesde), 'dd/MM/yyyy', { locale: es })}`;
    }
    if (fechaHasta) {
      return `Hasta ${format(new Date(fechaHasta), 'dd/MM/yyyy', { locale: es })}`;
    }
    return 'Este mes';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col md:items-center md:justify-center md:max-w-6xl md:mx-auto md:px-8 md:pl-28">
      <div className="text-center mb-8 mt-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          ¡Hola, {negocio.nombre_negocio || user?.email?.split('@')[0] || 'Usuario'}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Bienvenido a tu panel de control
        </p>
        <div className="w-16 h-1 mx-auto rounded-full" style={{ background: color_personalizado }}></div>
      </div>

      {/* Métricas Modernas */}
      <div className="grid grid-cols-2 gap-4 mb-8 px-4 md:grid-cols-6 md:gap-6 md:px-0">
        {/* Total Facturado */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">💰</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Total Facturado</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            ${totalFacturado.toFixed(2)}
          </div>
          <div className="text-xs text-green-600 dark:text-green-400 mt-1">
            Pagos completados
          </div>
        </div>

        {/* Pendiente a Pagar */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">📥</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Pendiente a Pagar</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            ${totalPendiente.toFixed(2)}
          </div>
          <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
            {totalPendiente > 0 ? 'Requiere atención' : 'Al día'}
          </div>
        </div>

        {/* Total Facturas */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">📄</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Facturas</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {totalFacturas}
          </div>
          <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
            Total emitidas
          </div>
        </div>

        {/* Cotizaciones Pendientes */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">📋</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Cotizaciones</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {cotizacionesPendientes}
          </div>
          <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
            Pendientes de aprobación
          </div>
        </div>

        {/* A Punto de Vencer */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-red-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">⚠️</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">A Punto de Vencer</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {aPuntoDeVencer}
          </div>
          <div className="text-xs text-red-600 dark:text-red-400 mt-1">
            Próximos 7 días
          </div>
        </div>
      </div>

      {/* Métrica Principal - Pagadas con Filtros */}
      <div className="w-full max-w-4xl mx-auto px-4 md:px-0 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                ${totalPagadas.toFixed(2)}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Total Cobrado - {getRangoFechasTexto()}
              </p>
            </div>
            <button
              onClick={() => setShowFiltrosFecha(!showFiltrosFecha)}
              className="px-4 py-2 rounded-xl font-semibold shadow-lg transition-all duration-200 flex items-center gap-2"
              style={{ background: color_personalizado, color: 'white' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Filtrar Fechas
            </button>
          </div>
          
          {showFiltrosFecha && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha Desde
                </label>
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha Hasta
                </label>
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => { setFechaDesde(''); setFechaHasta(''); }}
                  className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Limpiar Filtros
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sección de Clientes Recientes */}
      <div className="w-full max-w-4xl mx-auto px-4 md:px-0">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              Clientes Recientes
            </h2>
            <button
              onClick={() => setShowClienteModal(true)}
              className="px-4 py-2 rounded-xl font-semibold shadow-lg transition-all duration-200 flex items-center gap-2"
              style={{ background: color_personalizado, color: 'white' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Nuevo Cliente
            </button>
          </div>
          
          {clientes.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                No hay clientes aún
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Comienza agregando tu primer cliente para empezar a facturar
              </p>
              <button
                onClick={() => setShowClienteModal(true)}
                className="px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200"
                style={{ background: color_personalizado, color: 'white' }}
              >
                Agregar Primer Cliente
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {clientes.slice(0, 6).map((cliente: any) => (
                <div
                  key={cliente.id}
                  className="p-4 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {cliente.nombre?.charAt(0)?.toUpperCase() || 'C'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200 truncate">
                        {cliente.nombre}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {cliente.email || 'Sin email'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Botones de acción */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLlamarCliente(cliente)}
                      className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm flex items-center justify-center gap-1"
                      title="Llamar"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Llamar
                    </button>
                    
                    <button
                      onClick={() => handleEmailCliente(cliente)}
                      className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm flex items-center justify-center gap-1"
                      title="Enviar Email"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Email
                    </button>
                    
                    <button
                      onClick={() => handleWhatsappCliente(cliente)}
                      className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center justify-center gap-1"
                      title="WhatsApp"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.52 3.48A12.07 12.07 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.11.55 4.16 1.6 5.97L0 24l6.18-1.62A12.07 12.07 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.21-1.25-6.23-3.48-8.52zM12 22c-1.85 0-3.68-.5-5.25-1.45l-.37-.22-3.67.96.98-3.58-.24-.37A9.94 9.94 0 0 1 2 12c0-5.52 4.48-10 10-10s10 4.48 10 10-4.48 10-10 10zm5.2-7.8c-.28-.14-1.65-.81-1.9-.9-.25-.09-.43-.14-.61.14-.18.28-.28.9-.86 1.08-.16.18-.32.2-.6.07-.28-.14-1.18-.44-2.25-1.4-.83-.74-1.39-1.65-1.55-1.93-.16-.28-.02-.43.12-.57.13-.13.28-.34.42-.51.14-.17.18-.29.28-.48.09-.19.05-.36-.02-.5-.07-.14-.61-1.47-.84-2.01-.22-.53-.45-.46-.61-.47-.16-.01-.35-.01-.54-.01-.19 0-.5.07-.76.34-.26.27-1 1-.97 2.43.03 1.43 1.03 2.81 1.18 3.01.15.2 2.03 3.1 4.93 4.23.69.3 1.23.48 1.65.61.69.22 1.32.19 1.81.12.55-.08 1.65-.67 1.88-1.32.23-.65.23-1.21.16-1.32-.07-.11-.25-.18-.53-.32z"/>
                      </svg>
                      WA
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Cliente */}
      <ClienteModal
        open={showClienteModal}
        onClose={handleCloseModal}
        cliente={clienteEditando}
        onCreated={fetchClientes}
      />

      {/* Modal de Email */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
              Enviar Email a {clienteSeleccionado?.nombre}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Título del Email
                </label>
                <input
                  type="text"
                  value={emailData.titulo}
                  onChange={(e) => setEmailData({ ...emailData, titulo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  placeholder="Asunto del email"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descripción
                </label>
                <textarea
                  value={emailData.descripcion}
                  onChange={(e) => setEmailData({ ...emailData, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 min-h-[100px]"
                  placeholder="Contenido del email"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEmailModal(false);
                  setEmailData({ titulo: '', descripcion: '' });
                  setClienteSeleccionado(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleEnviarEmail}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Enviar Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 