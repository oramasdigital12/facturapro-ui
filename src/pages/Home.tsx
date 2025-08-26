import { useAuth, useDarkMode } from '../contexts/AuthContext';
import { useOutletContext } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useState, useEffect } from 'react';
import ClienteModal from '../components/ClienteModal';
import MensajeWhatsappModal from '../components/MensajeWhatsappModal';
import WhatsAppFacturaModal from '../components/WhatsAppFacturaModal';
import EmailFacturaModal from '../components/EmailFacturaModal';
import CompletarPagoModal from '../components/CompletarPagoModal';
import { buildPDFUrl } from '../utils/urls';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Swal from 'sweetalert2';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  // La configuración del negocio se maneja desde el Layout
  const [clienteEditando, setClienteEditando] = useState<any>(null);
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [showMensajeModal, setShowMensajeModal] = useState(false);
  const [clienteParaMensaje, setClienteParaMensaje] = useState<any>(null);
  const { } = useDarkMode();
  const outletContext = useOutletContext() as { 
    color_personalizado?: string;
    nombre_negocio?: string;
  } | null;
  const color_personalizado = outletContext?.color_personalizado || '#2563eb';
  const nombre_negocio = outletContext?.nombre_negocio || '';
  
  // Métricas de facturas
  const [totalFacturado, setTotalFacturado] = useState(0);
  const [totalPendiente, setTotalPendiente] = useState(0);
  const [totalPagadas, setTotalPagadas] = useState(0);
  const [totalFacturas, setTotalFacturas] = useState(0);
  const [aPuntoDeVencer, setAPuntoDeVencer] = useState(0);
  const [vencidas, setVencidas] = useState(0);

  // Estado para facturas recientes
  const [facturas, setFacturas] = useState([]);
  const [showWhatsAppFacturaModal, setShowWhatsAppFacturaModal] = useState(false);
  const [showEmailFacturaModal, setShowEmailFacturaModal] = useState(false);
  const [showCompletarPagoModal, setShowCompletarPagoModal] = useState(false);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<any>(null);

  // Filtros de fecha para métricas
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [showFiltrosFecha, setShowFiltrosFecha] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    fetchClientes();
    fetchMetricas();
    fetchFacturasRecientes();
  }, [fechaDesde, fechaHasta]);

  // La configuración del negocio se maneja desde el Layout, no necesitamos cargarla aquí

  const fetchClientes = async () => {
    try {
      const res = await api.get('/api/clientes');
      setClientes(res.data);
    } catch (error) {
      console.error('Error fetching clientes:', error);
    }
  };

  // La configuración del negocio se obtiene desde el Layout, no necesitamos esta función

  // Funciones para calcular estado de vencimiento (misma lógica que en Facturas.tsx)
  const calcularDiasHastaVencimiento = (fechaVencimiento: string) => {
    if (!fechaVencimiento) return null;
    const hoy = new Date();
    const vencimiento = new Date(fechaVencimiento);
    hoy.setHours(0, 0, 0, 0);
    vencimiento.setHours(0, 0, 0, 0);
    const diferencia = Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    return diferencia;
  };

  const fetchMetricas = async () => {
    try {
      const params: any = {};
      if (fechaDesde) params.fecha_inicio = fechaDesde;
      if (fechaHasta) params.fecha_fin = fechaHasta;
      
      const res = await api.get('/api/facturas', { params });
      const facturas = res.data.facturas || res.data || [];
      
      let total = 0, pendiente = 0, pagadas = 0, aVencer = 0, vencidas = 0;
      facturas.forEach((f: any) => {
        // Total facturado solo incluye las que se completaron el pago final
        if (f.estado === 'pagada') {
          total += f.total || 0;
          pagadas += f.total || 0;
        }
        if (f.estado === 'pendiente') {
          pendiente += f.total || 0;
          
          // Calcular facturas por vencer y vencidas usando fecha_vencimiento
          if (f.fecha_vencimiento) {
            const dias = calcularDiasHastaVencimiento(f.fecha_vencimiento);
            if (dias !== null) {
              if (dias < 0) {
                vencidas++;
              } else if (dias >= 0 && dias <= 3) {
                aVencer++;
              }
            }
          }
        }
      });
      
      setTotalFacturado(total);
      setTotalPendiente(pendiente);
      setTotalPagadas(pagadas);
      setTotalFacturas(facturas.length);
      setAPuntoDeVencer(aVencer);
      setVencidas(vencidas);
    } catch (error) {
      console.error('Error fetching métricas:', error);
    }
  };

  const fetchFacturasRecientes = async () => {
    try {
      const res = await api.get('/api/facturas');
      const facturasData = res.data.facturas || res.data || [];
      // Ordenar por fecha de creación (más recientes primero) y tomar las últimas 10
      const facturasOrdenadas = facturasData
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);
      setFacturas(facturasOrdenadas);
    } catch (error) {
      console.error('Error fetching facturas recientes:', error);
    }
  };

  // Funciones de redirección para las métricas
  const handleMetricaClick = (tipo: string) => {
    switch (tipo) {
      case 'totalFacturado':
        // Redirige a facturas con filtro "todas" (por defecto)
        navigate('/facturas');
        break;
      case 'pendientePagar':
        // Redirige a facturas con filtro "pendientes"
        navigate('/facturas?estado=pendiente');
        break;
      case 'facturas':
        // No hace nada, no tiene redirección
        break;
      case 'aPuntoDeVencer':
        // Redirige a facturas con filtro "por vencer"
        navigate('/facturas?estado=por_vencer');
        break;
      case 'vencidas':
        // Redirige a facturas con filtro "vencida"
        navigate('/facturas?estado=vencida');
        break;
      default:
        break;
    }
  };

  // const handleEditCliente = (cliente: any) => {
  //   setClienteEditando(cliente);
  //   setShowClienteModal(true);
  // };

  const handleCloseModal = () => {
    setShowClienteModal(false);
    setClienteEditando(null);
  };

  const handleLlamarCliente = async (cliente: any) => {
    if (!cliente.telefono || cliente.telefono.trim() === '') {
      const result = await Swal.fire({
        title: 'Sin teléfono registrado',
        text: 'Este cliente no tiene un número de teléfono guardado. Por favor, regístralo para poder llamar.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Editar',
        cancelButtonText: 'Cancelar',
      });
      if (result.isConfirmed) {
        setClienteEditando(cliente);
        setShowClienteModal(true);
      }
      return;
    }
    window.open(`tel:${cliente.telefono}`);
  };

  const handleEmailCliente = async (cliente: any) => {
    if (!cliente.email || cliente.email.trim() === '') {
      const result = await Swal.fire({
        title: 'Sin email registrado',
        text: 'Este cliente no tiene un email guardado. ¿Deseas agregarle uno?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Agregar Email',
        cancelButtonText: 'Cancelar',
      });
      if (result.isConfirmed) {
        setClienteEditando(cliente);
        setShowClienteModal(true);
      }
      return;
    }
    // Enviar email directo
    const subject = encodeURIComponent('Mensaje desde ' + (window.location.hostname || 'Tu Negocio'));
    const body = encodeURIComponent('Hola ' + cliente.nombre + ',\n\nEspero que estés bien.\n\nSaludos,\nTu Negocio');
    window.open(`mailto:${cliente.email}?subject=${subject}&body=${body}`);
  };

  const handleWhatsappCliente = async (cliente: any) => {
    if (!cliente.telefono || cliente.telefono.trim() === '') {
      const result = await Swal.fire({
        title: 'Sin teléfono registrado',
        text: 'Este cliente no tiene un número de teléfono guardado. Por favor, regístralo para poder enviar mensajes.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Editar',
        cancelButtonText: 'Cancelar',
      });
      if (result.isConfirmed) {
        setClienteEditando(cliente);
        setShowClienteModal(true);
      }
      return;
    }
    setClienteParaMensaje(cliente);
    setShowMensajeModal(true);
  };

  // Funciones para facturas recientes
  const handleVerInfoFactura = (factura: any) => {
    let infoHTML = `
      <div class="text-left space-y-3">
        <div class="flex items-center gap-2">
          <span class="font-semibold text-gray-700">Número de Factura:</span>
          <span>${String(factura.numero_factura || 'N/A')}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="font-semibold text-gray-700">Cliente:</span>
          <span>${factura.cliente?.nombre || 'N/A'}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="font-semibold text-gray-700">Total:</span>
          <span>$${factura.total?.toFixed(2) || '0.00'}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="font-semibold text-gray-700">Estado:</span>
          <span class="px-2 py-1 rounded-full text-xs font-medium ${
            factura.estado === 'pagada' ? 'bg-green-100 text-green-800' :
            factura.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
            factura.estado === 'vencida' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }">${factura.estado || 'N/A'}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="font-semibold text-gray-700">Fecha:</span>
          <span>${factura.fecha ? format(new Date(factura.fecha), 'dd/MM/yyyy', { locale: es }) : (factura.created_at ? format(new Date(factura.created_at), 'dd/MM/yyyy', { locale: es }) : 'N/A')}</span>
        </div>
        ${factura.due_date ? `
        <div class="flex items-center gap-2">
          <span class="font-semibold text-gray-700">Vence:</span>
          <span>${format(new Date(factura.due_date), 'dd/MM/yyyy', { locale: es })}</span>
        </div>
        ` : ''}
      </div>
    `;

    Swal.fire({
      title: 'Información de la Factura',
      html: infoHTML,
      icon: 'info',
      confirmButtonText: 'Cerrar',
      confirmButtonColor: color_personalizado,
    });
  };

  const handleVerPDFFactura = (factura: any) => {
    // Usar buildPDFUrl para generar la URL correcta del PDF
    const pdfUrl = buildPDFUrl(factura.id);
    window.open(pdfUrl, '_blank');
  };

  const handleCompletarPagoFactura = (factura: any) => {
    setFacturaSeleccionada(factura);
    setShowCompletarPagoModal(true);
  };

  const handlePagoCompletado = () => {
    // Recargar las facturas cuando se complete el pago
    fetchFacturasRecientes();
  };

  const handleWhatsappFactura = (factura: any) => {
    setFacturaSeleccionada(factura);
    setShowWhatsAppFacturaModal(true);
  };

  const handleEmailFactura = (factura: any) => {
    setFacturaSeleccionada(factura);
    setShowEmailFacturaModal(true);
  };

  const handleVerInfoCliente = (cliente: any) => {
    // Función para calcular la edad
    const calcularEdad = (fecha: string) => {
      if (!fecha || fecha === '9999-12-31') return '';
      const hoy = new Date();
      const nacimiento = new Date(fecha);
      let edad = hoy.getFullYear() - nacimiento.getFullYear();
      const m = hoy.getMonth() - nacimiento.getMonth();
      if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
      }
      return edad >= 0 ? edad : '';
    };

    let infoHTML = `
      <div class="text-left space-y-3">
        <div class="flex items-center gap-2">
          <span class="font-semibold text-gray-700">Nombre:</span>
          <span>${cliente.nombre}</span>
        </div>
    `;

    if (cliente.telefono) {
      infoHTML += `
        <div class="flex items-center gap-2">
          <span class="font-semibold text-gray-700">Teléfono:</span>
          <span>${cliente.telefono}</span>
        </div>
      `;
    }

    if (cliente.email) {
      infoHTML += `
        <div class="flex items-center gap-2">
          <span class="font-semibold text-gray-700">Email:</span>
          <span>${cliente.email}</span>
        </div>
      `;
    }

    if (cliente.fecha_nacimiento) {
      const edad = calcularEdad(cliente.fecha_nacimiento);
      if (edad) {
        infoHTML += `
          <div class="flex items-center gap-2">
            <span class="font-semibold text-gray-700">Edad:</span>
            <span>${edad} años</span>
          </div>
        `;
      }
    }

    if (cliente.direccion) {
      infoHTML += `
        <div class="flex items-center gap-2">
          <span class="font-semibold text-gray-700">Dirección:</span>
          <span>${cliente.direccion}</span>
        </div>
      `;
    }

    infoHTML += '</div>';

    Swal.fire({
      title: 'Información del Cliente',
      html: infoHTML,
      icon: 'info',
      confirmButtonText: 'Cerrar',
      confirmButtonColor: color_personalizado,
    });
  };

  const getRangoFechasTexto = () => {
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
          ¡Hola, {nombre_negocio || user?.email?.split('@')[0] || 'Usuario'}!
          </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Bienvenido a tu panel de control
        </p>
          <div className="w-16 h-1 mx-auto rounded-full" style={{ background: color_personalizado }}></div>
        </div>

      {/* Métricas Modernas */}
      <div className="grid grid-cols-2 gap-3 mb-6 px-3 sm:px-4 md:grid-cols-5 md:gap-4 md:px-0 md:max-w-6xl md:mx-auto">
        {/* Total Facturado - Clickeable */}
        <div 
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-3 md:p-4 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105"
          onClick={() => handleMetricaClick('totalFacturado')}
        >
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

        {/* Pendiente a Pagar - Clickeable */}
        <div 
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-3 md:p-4 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105"
          onClick={() => handleMetricaClick('pendientePagar')}
        >
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

        {/* Total Facturas - No clickeable */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-3 md:p-4 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
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

        {/* A Punto de Vencer - Clickeable */}
        <div 
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-3 md:p-4 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105"
          onClick={() => handleMetricaClick('aPuntoDeVencer')}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">⚠️</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">A Punto de Vencer</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {aPuntoDeVencer}
          </div>
          <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
            Próximos 3 días
          </div>
        </div>

        {/* Vencidas - Clickeable */}
        <div 
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-3 md:p-4 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105"
          onClick={() => handleMetricaClick('vencidas')}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">🚨</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Vencidas</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {vencidas}
          </div>
          <div className="text-xs text-red-600 dark:text-red-400 mt-1">
            Requieren atención
          </div>
        </div>
      </div>

      {/* Métrica Principal - Pagadas con Filtros */}
      <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 md:px-0 mb-6 md:mb-8">
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

      {/* Sección de Facturas Recientes */}
      <div className="w-full max-w-4xl mx-auto px-4 md:px-0 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              Facturas Recientes
            </h2>
            <button
              onClick={() => navigate('/facturas/nueva')}
              className="px-4 py-2 rounded-xl font-semibold shadow-lg transition-all duration-200 flex items-center gap-2"
              style={{ background: color_personalizado, color: 'white' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Nueva Factura
            </button>
          </div>
          
          {facturas.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                No hay facturas aún
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Comienza creando tu primera factura para empezar a facturar
              </p>
              <button
                onClick={() => navigate('/facturas/nueva')}
                className="px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200"
                style={{ background: color_personalizado, color: 'white' }}
              >
                Crear Primera Factura
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {facturas.slice(0, 6).map((factura: any) => (
                <div
                  key={factura.id}
                  className="p-4 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200 cursor-pointer"
                  onClick={() => handleVerInfoFactura(factura)}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {String(factura.numero_factura || 'F').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200 truncate">
                        #{String(factura.numero_factura || 'N/A')}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          factura.estado === 'pagada' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          factura.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          factura.estado === 'vencida' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}>
                          {factura.estado || 'N/A'}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          ${factura.total?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                        {factura.cliente?.nombre || 'Cliente N/A'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Botones de acción */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVerPDFFactura(factura);
                      }}
                      className="flex-1 min-w-0 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm flex items-center justify-center gap-1"
                      title="Ver PDF"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      PDF
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEmailFactura(factura);
                      }}
                      className="flex-1 min-w-0 px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm flex items-center justify-center gap-1"
                      title="Enviar Email"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Email
                    </button>
                    
                    {factura.estado === 'pendiente' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCompletarPagoFactura(factura);
                        }}
                        className="flex-1 min-w-0 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm flex items-center justify-center gap-1"
                        title="Completar Pago"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        Pagar
                      </button>
                    )}
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWhatsappFactura(factura);
                      }}
                      className="flex-1 min-w-0 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center justify-center gap-1"
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

      {/* Sección de Clientes Recientes */}
      <div className="w-full max-w-4xl mx-auto px-4 md:px-0 mb-6">
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
                  className="p-4 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200 cursor-pointer"
                  onClick={() => handleVerInfoCliente(cliente)}
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
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          cliente.categoria === 'activo' ? 'bg-green-100 text-green-800' :
                          cliente.categoria === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                          cliente.categoria === 'por_vencer' ? 'bg-orange-100 text-orange-800' :
                          cliente.categoria === 'Vencido' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {cliente.categoria}
                        </span>
                        {cliente.email && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {cliente.email}
                          </span>
                        )}
                    </div>
                  </div>
                </div>
                  
                  {/* Botones de acción */}
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLlamarCliente(cliente);
                      }}
                      className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm flex items-center justify-center gap-1"
                      title="Llamar"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Llamar
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEmailCliente(cliente);
                      }}
                      className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm flex items-center justify-center gap-1"
                      title="Enviar Email"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Email
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWhatsappCliente(cliente);
                      }}
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
        color_personalizado={color_personalizado}
      />

      {/* Modal de WhatsApp */}
      <MensajeWhatsappModal
        open={showMensajeModal}
        onClose={() => setShowMensajeModal(false)}
        cliente={clienteParaMensaje}
        color_personalizado={color_personalizado}
      />

      {/* Modal de WhatsApp Factura */}
      {showWhatsAppFacturaModal && facturaSeleccionada && (
        <WhatsAppFacturaModal
          open={showWhatsAppFacturaModal}
          onClose={() => setShowWhatsAppFacturaModal(false)}
          factura={facturaSeleccionada}
          color_personalizado={color_personalizado}
        />
      )}

      {/* Modal de Email Factura */}
      {showEmailFacturaModal && facturaSeleccionada && (
        <EmailFacturaModal
          open={showEmailFacturaModal}
          onClose={() => setShowEmailFacturaModal(false)}
          factura={facturaSeleccionada}
          color_personalizado={color_personalizado}
        />
      )}

      {/* Modal de Completar Pago */}
      {showCompletarPagoModal && facturaSeleccionada && (
        <CompletarPagoModal
          open={showCompletarPagoModal}
          onClose={() => setShowCompletarPagoModal(false)}
          factura={facturaSeleccionada}
          onPagoCompletado={handlePagoCompletado}
        />
      )}
    </div>
  );
} 