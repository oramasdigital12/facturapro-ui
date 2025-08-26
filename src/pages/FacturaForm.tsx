import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { getClientes, getServiciosNegocio, createFactura, getFacturaById, updateFactura, getNegocioConfig, getUltimaFactura, getMetodosPago, regenerateFacturaPDF } from '../services/api';
import { clearFacturaCache } from '../utils/urls';
import { getNumeroFactura, getNumeroFacturaOriginal, getSiguienteNumeroFactura } from '../utils/facturaHelpers';
import FacturaPreview from '../components/FacturaPreview';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { crearMensajePredefinido, obtenerMensajePredefinido } from '../utils/mensajeHelpers';
import { buildPublicFacturaUrl } from '../utils/urls';
import ClienteModal from '../components/ClienteModal';
import GestionCategoriasServiciosModal from '../components/GestionCategoriasServiciosModal';

export default function FacturaForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  // Estado de clientes y servicios
  const [clientes, setClientes] = useState<any[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{cliente?: string; items?: string; itemsDetalle?: string; fecha?: string; impuesto?: string; deposito?: string; nota?: string; terminos?: string; numero_factura?: string; fecha_vencimiento?: string; metodo_pago_id?: string}>({});
  const [facturaEstado, setFacturaEstado] = useState<string>('');
  const [editMode, setEditMode] = useState(false);
  const [negocioConfig, setNegocioConfig] = useState<any>(null);
  const [numeroFactura, setNumeroFactura] = useState<string | number>('-');
  const [facturaCargada, setFacturaCargada] = useState<any>(null);

  // Estado del formulario
  const [clienteId, setClienteId] = useState('');
  const [fechaFactura, setFechaFactura] = useState(() => new Date().toISOString().slice(0, 10));
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [, setMetodoPagoId] = useState('');
  const [, setMetodosPago] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [impuesto, setImpuesto] = useState(0);
  const [deposito, setDeposito] = useState(0);
  const [nota, setNota] = useState('');
  const [terminos, setTerminos] = useState('');
  const [clienteSearch, setClienteSearch] = useState('');
  const [showClienteSuggestions, setShowClienteSuggestions] = useState(false);
  const [servicioSearch, setServicioSearch] = useState('');
  const [showServicioSuggestions, setShowServicioSuggestions] = useState(false);

  // Estados para modales de creación rápida
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [showServiciosModal, setShowServiciosModal] = useState(false);

  // Totales
  const subtotal = items.reduce((acc, item) => acc + (item.precio_unitario * item.cantidad), 0);
  const totalImpuesto = subtotal * (impuesto / 100);
  const total = subtotal + totalImpuesto;
  const balance = total - deposito;

  // Cargar clientes, servicios y factura si hay id
  useEffect(() => {
    fetchClientes();
    fetchServicios();
    fetchNegocioConfig();
    fetchMetodosPago();
    if (id) {
      setEditMode(true);
      fetchFactura(id);
    } else {
      fetchNumeroSiguiente();
    }
  }, [id]);

  const fetchClientes = async () => {
    try {
      const res = await getClientes();
      setClientes(res.data || []);
    } catch {
      setClientes([]);
    }
  };
  const fetchServicios = async () => {
    try {
      const res = await getServiciosNegocio();
      setServicios(res.data || []);
    } catch {
      setServicios([]);
    }
  };

  const fetchNegocioConfig = async () => {
    try {
      const res = await getNegocioConfig();
      setNegocioConfig(res.data);
      // Poblar por defecto si está vacío
      setNota(prev => prev || res.data?.nota_factura || '');
      setTerminos(prev => prev || res.data?.terminos_condiciones || '');
    } catch {
      setNegocioConfig(null);
    }
  };

  const fetchMetodosPago = async () => {
    try {
      const res = await getMetodosPago();
      setMetodosPago(res.data || []);
    } catch {
      setMetodosPago([]);
    }
  };

  // Funciones para creación rápida de clientes y servicios
  const handleClienteCreated = async (nuevoCliente?: any) => {
    await fetchClientes();
    setShowClienteModal(false);
    
    // Si se pasó un cliente específico, autoseleccionarlo
    if (nuevoCliente && nuevoCliente.id) {
      setClienteId(nuevoCliente.id);
      setFormErrors({ ...formErrors, cliente: '' });
      toast.success(`Cliente "${nuevoCliente.nombre}" creado y seleccionado automáticamente.`);
    } else {
      toast.success('Cliente actualizado exitosamente.');
    }
  };

  const handleServicioCreated = async (nuevoServicio?: any) => {
    // Cerrar el modal primero
    setShowServiciosModal(false);
    
    // Recargar todos los servicios
    await fetchServicios();
    
    // Si se pasó un servicio específico, autoseleccionarlo
    if (nuevoServicio && nuevoServicio.id) {
      // Agregar el servicio automáticamente a la factura inmediatamente
      const servicioEncontrado = servicios.find((s: any) => s.id === nuevoServicio.id);
      if (servicioEncontrado) {
        handleAddServicio(nuevoServicio.id);
        setServicioSearch('');
        setShowServicioSuggestions(false);
        toast.success(`Servicio "${nuevoServicio.nombre}" creado y agregado automáticamente.`);
      } else {
        // Si no se encuentra en el estado actual, usar los datos del nuevo servicio
        const nuevoItem = {
          categoria: nuevoServicio.categoria?.nombre || '',
          descripcion: nuevoServicio.nombre,
          precio_unitario: nuevoServicio.precio,
          cantidad: 1,
          total: nuevoServicio.precio * 1
        };
        setItems([...items, nuevoItem]);
        setServicioSearch('');
        setShowServicioSuggestions(false);
        toast.success(`Servicio "${nuevoServicio.nombre}" creado y agregado automáticamente.`);
      }
    } else {
      toast.success('Servicio creado exitosamente. Ahora puedes agregarlo a la factura.');
    }
  };

  const handleCrearCliente = () => {
    setShowClienteSuggestions(false);
    setShowClienteModal(true);
  };

  const handleCrearServicio = () => {
    setShowServicioSuggestions(false);
    setShowServiciosModal(true);
  };

  const fetchNumeroSiguiente = async () => {
    try {
      const res = await getUltimaFactura();
      const ultima = res.data && res.data.length > 0 ? res.data[0] : null;
      
      const siguienteNumero = getSiguienteNumeroFactura(ultima);
      setNumeroFactura(siguienteNumero);
    } catch {
      setNumeroFactura('1001'); // Primera factura será 1001
    }
  };

  const fetchFactura = async (facturaId: string) => {
    try {
      const res = await getFacturaById(facturaId);
      const f = res.data;
      setFacturaCargada(f);
      setClienteId(f.cliente_id);
      setFechaFactura(f.fecha_factura);
      setFechaVencimiento(f.fecha_vencimiento || '');
      setMetodoPagoId(f.metodo_pago_id || '');

      setNumeroFactura(getNumeroFactura(f) || '1001'); // Establecer el número de factura
      setItems(f.items.map((i: any) => ({
        categoria: i.categoria,
        descripcion: i.descripcion,
        precio_unitario: i.precio_unitario,
        cantidad: i.cantidad,
        total: i.total
      })));
      setImpuesto(f.impuesto ? (f.impuesto / (f.subtotal || 1)) * 100 : 0);
      setDeposito(f.deposito || 0);
      setNota(f.nota || '');
      setTerminos(f.terminos || '');
      setFacturaEstado(f.estado);
    } catch {
      setError('No se pudo cargar la factura');
    }
  };

  // Añadir servicio a la factura
  const handleAddServicio = (servicioId: string) => {
    const servicio = servicios.find((s: any) => s.id === servicioId);
    if (servicio) {
      const nuevoItem = {
        categoria: servicio.categoria || '',
        descripcion: servicio.nombre,
        precio_unitario: servicio.precio,
        cantidad: 1,
        total: servicio.precio * 1 // Calcular total correctamente
      };
      setItems([...items, nuevoItem]);
    }
  };

  // Actualizar cantidad de un item
  const handleUpdateCantidad = (index: number, nuevaCantidad: number) => {
    if (nuevaCantidad <= 0) return;
    
    const itemsActualizados = items.map((item, i) => {
      if (i === index) {
        return {
          ...item,
          cantidad: nuevaCantidad,
          total: item.precio_unitario * nuevaCantidad
        };
      }
      return item;
    });
    setItems(itemsActualizados);
  };

  // Eliminar item
  const handleDeleteItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Validación antes de enviar
  const validateForm = () => {
    const errors: {cliente?: string; items?: string; itemsDetalle?: string; fecha?: string; impuesto?: string; deposito?: string; numero_factura?: string; fecha_vencimiento?: string} = {};
    
    // Validar cliente
    if (!clienteId) errors.cliente = 'Selecciona un cliente.';
    
    // Validar items
    if (items.length === 0) errors.items = 'Agrega al menos un servicio.';
    if (items.some(i => i.cantidad <= 0 || i.precio_unitario <= 0)) errors.itemsDetalle = 'Cantidad y precio deben ser mayores a 0.';
    
    // Validar fecha
    if (!fechaFactura) errors.fecha = 'La fecha de factura es obligatoria.';
    
    // Validar fecha de vencimiento (completamente opcional)
    if (fechaVencimiento && fechaVencimiento.trim() !== '') {
      // Verificar si es una fecha válida (no es el placeholder del navegador)
      const fechaVenc = new Date(fechaVencimiento);
      if (isNaN(fechaVenc.getTime())) {
        errors.fecha_vencimiento = 'La fecha de vencimiento debe ser válida.';
      }
    }
    
    // Validar impuesto
    if (impuesto === null || impuesto === undefined || impuesto < 0) errors.impuesto = 'El impuesto debe ser un número válido mayor o igual a 0.';
    
    // Validar depósito
    if (deposito === null || deposito === undefined || deposito < 0) errors.deposito = 'El depósito debe ser un número válido mayor o igual a 0.';
    
    // NOTA: Se removieron las validaciones obligatorias de nota y términos
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Confirmar antes de crear/actualizar
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!validateForm()) return;
    
    // Confirmar antes de crear/actualizar
    const result = await Swal.fire({
      title: editMode ? '¿Actualizar factura?' : '¿Crear factura?',
      text: editMode ? '¿Deseas actualizar esta factura?' : '¿Deseas crear esta factura?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: editMode ? 'Sí, actualizar' : 'Sí, crear',
      cancelButtonText: 'Cancelar'
    });
    
    if (!result.isConfirmed) return;
    
    setLoading(true);
    try {
      // Mostrar loading inmediato
      toast.loading(editMode ? 'Actualizando factura...' : 'Creando factura...', { id: 'crearFactura' });
      
      // Obtener datos completos del cliente
      const clienteSeleccionado = clientes.find(c => c.id === clienteId);
      
      const body = {
        cliente_id: clienteId,
        cliente: clienteSeleccionado, // Incluir datos completos del cliente
        negocio: {
          nombre: negocioConfig?.nombre_negocio,
          direccion: negocioConfig?.direccion,
          email: negocioConfig?.email,
          telefono: negocioConfig?.telefono,
          logo_url: negocioConfig?.logo_url,
          nota: negocioConfig?.nota_factura,
        }, // Incluir datos completos del negocio (sin términos)
        fecha_factura: fechaFactura,
        fecha_vencimiento: fechaVencimiento && fechaVencimiento.trim() !== '' ? fechaVencimiento : undefined,
        numero_factura: getNumeroFacturaOriginal(facturaCargada) || numeroFactura,
        subtotal,
        impuesto: totalImpuesto,
        total,
        deposito,
        balance_restante: balance,
        nota: nota && nota.trim() !== '' ? nota : undefined,
        terminos: terminos && terminos.trim() !== '' ? terminos : undefined,
        items: items.map(i => ({
          categoria: i.categoria,
          descripcion: i.descripcion,
          precio_unitario: i.precio_unitario,
          cantidad: i.cantidad,
          total: i.total
        }))
      };
      if (editMode && id) {
        await updateFactura(id, body);
        
        // Intentar regenerar el PDF usando el endpoint específico
        try {
          await regenerateFacturaPDF(id);
          clearFacturaCache(id);
          toast.success('PDF regenerado exitosamente');
        } catch (pdfError) {
          console.warn('Error al regenerar PDF:', pdfError);
          // Fallback: limpiar caché del navegador
          if (id) {
            clearFacturaCache(id);
          }
        }
      } else {
        const facturaCreada = await createFactura(body);
        setClienteId('');
        setItems([]);
        setImpuesto(0);
        setDeposito(0);
        setNota('');
        setTerminos('');
        setFechaVencimiento('');
        setFormErrors({});
        
        // Crear mensajes predefinidos automáticamente SOLO si no existen
        try {
          const facturaData = facturaCreada.data || facturaCreada;
          const linkFactura = buildPublicFacturaUrl(facturaData.id, facturaData);
          
          // Verificar si ya existen mensajes predefinidos antes de crear
          const mensajeWhatsAppExistente = await obtenerMensajePredefinido('pendiente', 'whatsapp');
          const mensajeEmailExistente = await obtenerMensajePredefinido('pendiente', 'email');
          
          // Solo crear si no existen
          if (!mensajeWhatsAppExistente) {
            await crearMensajePredefinido('pendiente', 'whatsapp', facturaData, linkFactura);
            console.log('Mensaje predefinido WhatsApp creado automáticamente');
          }
          
          if (!mensajeEmailExistente) {
            await crearMensajePredefinido('pendiente', 'email', facturaData, linkFactura);
            console.log('Mensaje predefinido Email creado automáticamente');
          }
          
          if (mensajeWhatsAppExistente && mensajeEmailExistente) {
            console.log('Mensajes predefinidos ya existen, usando los guardados');
          }
        } catch (mensajeError) {
          console.warn('Error verificando/creando mensajes predefinidos:', mensajeError);
          // No fallar la creación de la factura por errores en mensajes
        }
      }
      
      // Cerrar loading y mostrar éxito
      toast.dismiss('crearFactura');
      toast.success(editMode ? 'Factura actualizada exitosamente' : 'Factura creada exitosamente');
      
      navigate('/facturas');
    } catch (err: any) {
      toast.dismiss('crearFactura');
      setError(err.message || 'Error al guardar factura');
    } finally {
      setLoading(false);
    }
  };

  // Guardar como borrador
  const handleGuardarBorrador = async () => {
    setError(null);
    setSuccess(null);
    if (!validateForm()) return;
    
    // Confirmar antes de guardar como borrador
    const result = await Swal.fire({
      title: '¿Guardar como borrador?',
      text: '¿Deseas guardar esta factura como borrador?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, guardar borrador',
      cancelButtonText: 'Cancelar'
    });
    
    if (!result.isConfirmed) return;
    
    setLoading(true);
    try {
      // Mostrar loading inmediato
      toast.loading('Guardando borrador...', { id: 'guardarBorrador' });
      
      // Obtener datos completos del cliente
      const clienteSeleccionado = clientes.find(c => c.id === clienteId);
      
      const body = {
        cliente_id: clienteId,
        cliente: clienteSeleccionado, // Incluir datos completos del cliente
        negocio: {
          nombre: negocioConfig?.nombre_negocio,
          direccion: negocioConfig?.direccion,
          email: negocioConfig?.email,
          telefono: negocioConfig?.telefono,
          logo_url: negocioConfig?.logo_url,
          nota: negocioConfig?.nota_factura,
        }, // Incluir datos completos del negocio (sin términos)
        fecha_factura: fechaFactura,
        fecha_vencimiento: fechaVencimiento && fechaVencimiento.trim() !== '' ? fechaVencimiento : undefined,
        numero_factura: getNumeroFacturaOriginal(facturaCargada) || numeroFactura,
        subtotal,
        impuesto: totalImpuesto,
        total,
        deposito,
        balance_restante: balance,
        nota: nota && nota.trim() !== '' ? nota : undefined,
        terminos: terminos && terminos.trim() !== '' ? terminos : undefined,
        estado: 'borrador',
        items: items.map(i => ({
          categoria: i.categoria,
          descripcion: i.descripcion,
          precio_unitario: i.precio_unitario,
          cantidad: i.cantidad,
          total: i.total
        }))
      };
      if (editMode && id) {
        await updateFactura(id, body);
      } else {
        await createFactura(body);
        setClienteId('');
        setItems([]);
        setImpuesto(0);
        setDeposito(0);
        setNota('');
        setTerminos('');
        setFechaVencimiento('');
        setFormErrors({});
      }
      
      // Cerrar loading y mostrar éxito
      toast.dismiss('guardarBorrador');
      toast.success('Borrador guardado exitosamente');
      
      navigate('/facturas');
    } catch (err: any) {
      toast.dismiss('guardarBorrador');
      setError(err.message || 'Error al guardar borrador');
    } finally {
      setLoading(false);
    }
  };

  // Confirmar antes de cancelar
  const handleCancelar = async () => {
    // Verificar si hay cambios sin guardar
    const hayCambios = clienteId || items.length > 0 || nota || terminos || impuesto > 0 || deposito > 0;
    
    if (hayCambios) {
      const result = await Swal.fire({
        title: '¿Cancelar edición?',
        text: '¿Deseas cancelar y volver al listado de facturas? Los cambios no guardados se perderán.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, cancelar',
        cancelButtonText: 'Volver'
      });
      if (result.isConfirmed) {
        navigate('/facturas');
      }
    } else {
      // Si no hay cambios, navegar directamente
      navigate('/facturas');
    }
  };

  const isEditable = !editMode || (facturaEstado !== 'pagada');

  // Filtrar clientes por búsqueda
  const clientesFiltrados = clienteSearch.trim().length > 0
    ? clientes.filter(c => c.nombre.toLowerCase().includes(clienteSearch.toLowerCase()))
    : clientes;

  // Filtrar servicios por búsqueda
  const serviciosFiltrados = servicioSearch.trim().length > 0
    ? servicios.filter(s => s.nombre.toLowerCase().includes(servicioSearch.toLowerCase()))
    : servicios;

  const [showPreviewMobile, setShowPreviewMobile] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
   
  // Obtener el color personalizado del negocio
  const outletContext = useOutletContext() as { color_personalizado?: string } | null;
  const color_personalizado = outletContext?.color_personalizado || '#2563eb';

  // Detectar si es móvil
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Cerrar dropdowns cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.cliente-dropdown')) {
        setShowClienteSuggestions(false);
      }
      if (!target.closest('.servicio-dropdown')) {
        setShowServicioSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col w-full max-w-full md:items-center md:justify-center md:max-w-6xl md:mx-auto md:px-8 md:pl-28">
      
      <form className="w-full max-w-full md:max-w-4xl mx-auto bg-white md:rounded-2xl md:shadow-lg md:p-6 p-4 flex flex-col gap-6 pb-8 relative" onSubmit={handleSubmit}>
        {/* Botón cerrar moderno (solo desktop) */}
        <button
          type="button"
          className="hidden md:block absolute top-4 right-4 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-lg font-bold shadow-lg transition-all duration-200 hover:scale-110 z-10"
          onClick={() => navigate('/facturas')}
          aria-label="Cerrar"
        >
          ×
        </button>
        {/* Header moderno con gradiente */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-100 p-6 rounded-2xl border-2 border-blue-200 mb-6">
          <div className="flex items-center mb-4">
            {/* Flecha back solo en móvil/tablet */}
            <button
              type="button"
              className="md:hidden mr-3 p-3 rounded-full bg-white hover:bg-gray-50 shadow-md transition-all duration-200 hover:scale-110"
              onClick={() => navigate('/facturas')}
              aria-label="Volver a facturas"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-blue-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <div className="flex-1 text-center">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                {editMode ? '✏️ Editar Factura' : '🚀 Nueva Factura'}
              </h1>
              <p className="text-sm md:text-base text-gray-600">
                {editMode ? 'Modifica los datos de tu factura' : 'Completa la información para generar tu factura'}
              </p>
            </div>
          </div>
        </div>
        
        {error && <div className="text-red-500 text-center mb-2 text-base">{error}</div>}
        {success && <div className="text-green-600 text-center mb-2 text-base">{success}</div>}
        {editMode && facturaEstado === 'pagada' && (
          <div className="text-center text-yellow-700 bg-yellow-100 rounded p-2 mb-4 font-semibold">Esta factura está pagada y no puede ser editada.</div>
        )}

        {/* Cliente */}
        <div className="mb-4 relative cliente-dropdown">
          <label className="block text-sm font-semibold mb-2 text-gray-700">Cliente *</label>
          <div className="relative">
            <div
              className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 text-base bg-white cursor-pointer pr-20 ${formErrors.cliente ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-blue-300'}`}
              onClick={() => {
                setShowClienteSuggestions(!showClienteSuggestions);
                if (!showClienteSuggestions) {
                  setClienteSearch('');
                }
                setTimeout(() => {
                  const inputElement = document.getElementById('cliente-search-input');
                  if (inputElement) inputElement.focus();
                }, 100);
              }}
            >
              {clienteId
                ? clientes.find(c => c.id === clienteId)?.nombre || 'Selecciona un cliente'
                : 'Selecciona un cliente'}
            </div>
            {/* Botón Crear Cliente - Siempre visible */}
            <button
              type="button"
              onClick={handleCrearCliente}
              className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors font-medium"
            >
              + Crear
            </button>
          </div>
          {showClienteSuggestions && (
            <div className="absolute z-20 bg-white border rounded-2xl shadow max-h-52 overflow-y-auto w-full mt-1">
              <input
                id="cliente-search-input"
                type="text"
                className="w-full px-4 py-3 border-b focus:outline-none text-base"
                placeholder="Buscar cliente..."
                value={clienteSearch}
                onChange={e => setClienteSearch(e.target.value)}
                onClick={e => e.stopPropagation()}
                autoComplete="off"
              />
              {clientesFiltrados.length === 0 ? (
                <div className="px-4 py-3 text-gray-500 text-base">
                  {clienteSearch ? 'No se encontraron clientes' : 'No hay clientes'}
                </div>
              ) : (
                clientesFiltrados.map(c => (
                  <div
                    key={c.id}
                    className={`px-4 py-3 hover:bg-blue-50 cursor-pointer text-base ${clienteId === c.id ? 'bg-blue-50 font-semibold' : ''}`}
                    onClick={() => {
                      setClienteId(c.id);
                      setClienteSearch('');
                      setShowClienteSuggestions(false);
                      setFormErrors({ ...formErrors, cliente: '' });
                    }}
                  >
                    {c.nombre}
                  </div>
                ))
              )}
            </div>
          )}
          {formErrors.cliente && <div className="text-xs text-red-500 mt-1">{formErrors.cliente}</div>}
        </div>

        {/* Servicios / Items - Modernizado */}
        <div className="mb-6 relative servicio-dropdown">
          <label className="block text-sm font-semibold mb-3 text-gray-700">Servicios / Items *</label>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border-2 border-blue-100 mb-4">
            <div className="relative">
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl bg-white border-2 border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-base transition-all duration-200 pr-20"
                placeholder="🔍 Buscar y agregar servicio..."
                value={servicioSearch}
                onChange={e => {
                  setServicioSearch(e.target.value);
                  setShowServicioSuggestions(true);
                }}
                onFocus={() => setShowServicioSuggestions(true)}
                disabled={!isEditable}
                autoComplete="off"
              />
              {/* Botón Crear Servicio - Siempre visible */}
              <button
                type="button"
                onClick={handleCrearServicio}
                className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors font-medium"
              >
                + Crear
              </button>
            </div>
            {showServicioSuggestions && serviciosFiltrados.length > 0 && (
              <div className="absolute z-20 bg-white border-2 border-blue-200 rounded-2xl shadow-xl max-h-52 overflow-y-auto w-full mt-2 left-0 right-0">
                {serviciosFiltrados.map(s => (
                  <div
                    key={s.id}
                    className="px-4 py-3 hover:bg-blue-50 cursor-pointer text-base border-b border-gray-100 last:border-b-0 transition-colors"
                    onClick={() => {
                      handleAddServicio(s.id);
                      setServicioSearch('');
                      setShowServicioSuggestions(false);
                    }}
                  >
                    <div className="font-medium text-gray-800">{s.nombre}</div>
                    <div className="text-sm text-blue-600 font-semibold">${s.precio}</div>
                  </div>
                ))}
              </div>
            )}
            {showServicioSuggestions && serviciosFiltrados.length === 0 && (
              <div className="absolute z-20 bg-white border-2 border-blue-200 rounded-2xl shadow-xl w-full mt-2 left-0 right-0">
                <div className="px-4 py-3 text-gray-500 text-base">
                  {servicioSearch ? 'No se encontraron servicios' : 'No hay servicios'}
                </div>
              </div>
            )}
          </div>
        </div>

          {/* Items/servicios agregados - Modernizado */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-gray-800">Items agregados</h3>
              <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </div>
            </div>
            
                         {/* Vista de tarjetas modernas en móvil */}
             <div className="flex flex-col gap-4 md:hidden">
               {items.length === 0 && (
                 <div className="text-center py-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                   <div className="text-gray-400 text-base mb-2">📋 No hay servicios agregados</div>
                   <div className="text-sm text-gray-500">Busca y agrega servicios arriba</div>
                 </div>
               )}
               {items.map((item, idx) => (
                 <div key={idx} className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-4 relative hover:shadow-xl transition-shadow duration-200">
                   <button
                     type="button"
                     onClick={() => handleDeleteItem(idx)}
                     className="absolute top-3 right-3 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md transition-all duration-200 hover:scale-110"
                   >
                     ×
                   </button>
                   <div className="pr-12">
                     <div className="font-bold text-gray-800 text-base mb-2">{item.descripcion}</div>
                     <div className="text-sm text-gray-600 mb-1">📁 {item.categoria}</div>
                     
                     {/* Controles de cantidad en móvil */}
                     <div className="flex items-center justify-between mt-3 mb-2">
                       <span className="text-sm text-gray-600">Cantidad:</span>
                       <div className="flex items-center bg-gray-100 rounded-lg">
                         <button
                           type="button"
                           onClick={() => handleUpdateCantidad(idx, Math.max(1, item.cantidad - 1))}
                           className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded-l-lg transition-colors"
                           disabled={!isEditable}
                         >
                           -
                         </button>
                         <input
                           type="number"
                           min="1"
                           value={item.cantidad}
                           onChange={(e) => {
                             const value = parseInt(e.target.value) || 1;
                             handleUpdateCantidad(idx, Math.max(1, value));
                           }}
                           className="w-12 h-8 text-center bg-white border-0 focus:outline-none text-sm font-semibold"
                           disabled={!isEditable}
                         />
                         <button
                           type="button"
                           onClick={() => handleUpdateCantidad(idx, item.cantidad + 1)}
                           className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded-r-lg transition-colors"
                           disabled={!isEditable}
                         >
                           +
                         </button>
                       </div>
                     </div>
                     
                     <div className="flex justify-between items-center mb-2">
                       <div className="text-sm">
                         <span className="text-gray-500">Precio unitario:</span> 
                         <span className="font-semibold ml-1">${item.precio_unitario}</span>
                       </div>
                     </div>
                     <div className="pt-2 border-t border-gray-200">
                       <div className="flex justify-between items-center">
                         <span className="text-gray-700 font-medium">Total:</span>
                         <span className="text-blue-700 font-bold text-lg">${(item.precio_unitario * item.cantidad).toFixed(2)}</span>
                       </div>
                     </div>
                   </div>
                 </div>
               ))}
             </div>
            
            {/* Tabla moderna para desktop/tablet */}
            <div className="hidden md:block">
              {items.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                  <div className="text-gray-400 text-lg mb-2">📋 No hay servicios agregados</div>
                  <div className="text-sm text-gray-500">Busca y agrega servicios arriba</div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden">
                  <table className="w-full text-sm">
                                         <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                       <tr>
                         <th className="px-4 py-3 text-left font-bold text-gray-700">📁 Categoría</th>
                         <th className="px-4 py-3 text-left font-bold text-gray-700">📝 Descripción</th>
                         <th className="px-4 py-3 text-left font-bold text-gray-700">💰 Precio Unit.</th>
                         <th className="px-4 py-3 text-left font-bold text-gray-700">📊 Cantidad</th>
                         <th className="px-4 py-3 text-left font-bold text-gray-700">💳 Total</th>
                         <th className="px-4 py-3 text-center font-bold text-gray-700">🗑️ Acción</th>
                       </tr>
                     </thead>
                     <tbody>
                       {items.map((item, idx) => (
                         <tr key={idx} className="border-t border-gray-200 hover:bg-gray-50 transition-colors">
                           <td className="px-4 py-3 text-gray-600">{item.categoria}</td>
                           <td className="px-4 py-3 font-medium text-gray-800">{item.descripcion}</td>
                           <td className="px-4 py-3 font-semibold text-gray-700">${item.precio_unitario}</td>
                           <td className="px-4 py-3">
                             <div className="flex items-center bg-gray-100 rounded-lg w-24">
                               <button
                                 type="button"
                                 onClick={() => handleUpdateCantidad(idx, Math.max(1, item.cantidad - 1))}
                                 className="w-6 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded-l-lg transition-colors text-sm"
                                 disabled={!isEditable}
                               >
                                 -
                               </button>
                               <input
                                 type="number"
                                 min="1"
                                 value={item.cantidad}
                                 onChange={(e) => {
                                   const value = parseInt(e.target.value) || 1;
                                   handleUpdateCantidad(idx, Math.max(1, value));
                                 }}
                                 className="w-12 h-8 text-center bg-white border-0 focus:outline-none text-sm font-semibold"
                                 disabled={!isEditable}
                               />
                               <button
                                 type="button"
                                 onClick={() => handleUpdateCantidad(idx, item.cantidad + 1)}
                                 className="w-6 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded-r-lg transition-colors text-sm"
                                 disabled={!isEditable}
                               >
                                 +
                               </button>
                             </div>
                           </td>
                           <td className="px-4 py-3 font-bold text-blue-700">${(item.precio_unitario * item.cantidad).toFixed(2)}</td>
                           <td className="px-4 py-3 text-center">
                             <button 
                               type="button" 
                               onClick={() => handleDeleteItem(idx)} 
                               className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md transition-all duration-200 hover:scale-110 mx-auto"
                             >
                               ×
                             </button>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          {formErrors.items && <div className="text-xs text-red-500 mt-1">{formErrors.items}</div>}
          {formErrors.itemsDetalle && <div className="text-xs text-red-500 mt-1">{formErrors.itemsDetalle}</div>}

        {/* Layout moderno optimizado - flujo vertical eficiente */}
        <div className="space-y-6">
          {/* Número de factura, fecha de creación y fecha de vencimiento en una fila */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Número de Factura</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-gray-100 text-gray-600 text-base font-medium cursor-not-allowed" 
                value={facturaCargada?.numero_factura_formateado || numeroFactura} 
                readOnly
                disabled
                placeholder="Número de factura automático"
              />
              <p className="text-xs text-gray-500 mt-1">Generado automáticamente</p>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Fecha de Creación *</label>
              <input 
                type="date" 
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 text-base ${formErrors.fecha ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-blue-400 focus:bg-blue-50'}`} 
                value={fechaFactura} 
                onChange={e => {
                  setFechaFactura(e.target.value);
                  if (formErrors.fecha) setFormErrors({...formErrors, fecha: ''});
                }} 
              />
              {formErrors.fecha && <div className="text-xs text-red-500 mt-1">{formErrors.fecha}</div>}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Fecha de Vencimiento</label>
              <input 
                type="date" 
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 text-base ${formErrors.fecha_vencimiento ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-blue-400 focus:bg-blue-50'}`} 
                value={fechaVencimiento} 
                onChange={e => {
                  setFechaVencimiento(e.target.value);
                  if (formErrors.fecha_vencimiento) setFormErrors({...formErrors, fecha_vencimiento: ''});
                }} 
              />
              {formErrors.fecha_vencimiento && <div className="text-xs text-red-500 mt-1">{formErrors.fecha_vencimiento}</div>}
              <p className="text-xs text-gray-500 mt-1">Opcional</p>
            </div>
          </div>

          {/* Subtotal y Total en una fila */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Subtotal</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-gray-100 text-gray-600 text-base font-medium cursor-not-allowed" 
                value={`$${subtotal.toFixed(2)}`} 
                readOnly 
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">Calculado automáticamente</p>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Total</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-blue-50 text-blue-700 text-base font-bold cursor-not-allowed" 
                value={`$${total.toFixed(2)}`} 
                readOnly 
                disabled
              />
              <p className="text-xs text-blue-600 mt-1">Total final con impuestos</p>
            </div>
          </div>

          {/* Impuesto y depósito en una fila */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Impuesto (%) *</label>
              <input 
                type="number" 
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 text-base ${formErrors.impuesto ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-blue-400 focus:bg-blue-50'}`} 
                value={impuesto} 
                onChange={e => {
                  const value = e.target.value === '' ? 0 : Number(e.target.value);
                  setImpuesto(value);
                  if (formErrors.impuesto) setFormErrors({...formErrors, impuesto: ''});
                }}
                onFocus={(e) => {
                  if (e.target.value === '0') {
                    e.target.value = '';
                  }
                }}
                min="0"
                step="0.01"
              />
              {formErrors.impuesto && <div className="text-xs text-red-500 mt-1">{formErrors.impuesto}</div>}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Depósito recibido *</label>
              <input 
                type="number" 
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 text-base ${formErrors.deposito ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-blue-400 focus:bg-blue-50'}`} 
                value={deposito} 
                onChange={e => {
                  const value = e.target.value === '' ? 0 : Number(e.target.value);
                  setDeposito(value);
                  if (formErrors.deposito) setFormErrors({...formErrors, deposito: ''});
                }}
                onFocus={(e) => {
                  if (e.target.value === '0') {
                    e.target.value = '';
                  }
                }}
                min="0"
                step="0.01"
              />
              {formErrors.deposito && <div className="text-xs text-red-500 mt-1">{formErrors.deposito}</div>}
            </div>
          </div>

          {/* Balance restante */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Balance restante</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-green-50 text-green-700 text-base font-bold cursor-not-allowed" 
              value={`$${balance.toFixed(2)}`} 
              readOnly 
              disabled
            />
            <p className="text-xs text-green-600 mt-1">Monto pendiente por pagar</p>
          </div>

          {/* Nota y términos en una fila */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Nota</label>
              <textarea 
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 text-base min-h-[100px] resize-none ${formErrors.nota ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-blue-400 focus:bg-blue-50'}`} 
                value={nota} 
                onChange={e => {
                  setNota(e.target.value);
                  if (formErrors.nota) setFormErrors({...formErrors, nota: ''});
                }} 
              />
              {formErrors.nota && <div className="text-xs text-red-500 mt-1">{formErrors.nota}</div>}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Términos</label>
              <textarea 
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 text-base min-h-[100px] resize-none ${formErrors.terminos ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-blue-400 focus:bg-blue-50'}`} 
                value={terminos} 
                onChange={e => {
                  setTerminos(e.target.value);
                  if (formErrors.terminos) setFormErrors({...formErrors, terminos: ''});
                }} 
              />
              {formErrors.terminos && <div className="text-xs text-red-500 mt-1">{formErrors.terminos}</div>}
            </div>
          </div>

          {/* Botones finales modernos y profesionales */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-2xl border-2 border-gray-200 mt-8">
            <div className="flex flex-col gap-3 md:flex-row md:gap-4 md:justify-end">
              <button
                type="button"
                className="w-full md:w-auto px-8 py-4 rounded-xl bg-white text-gray-700 font-bold hover:bg-gray-50 transition-all duration-200 border-2 border-gray-300 shadow-md hover:shadow-lg transform hover:scale-105"
                onClick={handleCancelar}
                disabled={loading}
              >
                ❌ Cancelar
              </button>
              <button
                type="button"
                className="w-full md:w-auto px-8 py-4 rounded-xl bg-yellow-500 text-white font-bold hover:bg-yellow-600 transition-all duration-200 border-2 border-yellow-600 shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                onClick={handleGuardarBorrador}
                disabled={loading}
              >
                📝 Guardar Borrador
              </button>
              <button
                type="submit"
                className="w-full md:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                disabled={loading}
                style={{ background: loading ? '#9ca3af' : undefined }}
              >
                {loading ? '⏳ Procesando...' : (editMode ? '✅ Actualizar Factura' : '🚀 Crear Factura')}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Botón circular sticky con icono de ojo, solo móvil, siempre visible */}
      <button
        type="button"
        className="md:hidden fixed right-4 top-[30vh] w-16 h-16 rounded-full flex items-center justify-center text-white text-3xl shadow-lg border-4 border-white z-40 transition-all duration-300 hover:opacity-90 hover:scale-110"
        onClick={() => setShowPreviewMobile(true)}
        aria-label="Ver vista previa"
        style={{ 
          backgroundColor: color_personalizado,
          boxShadow: '0 8px 32px 0 rgba(0,0,0,0.15)' 
        }}
      >
        <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor' className='w-8 h-8'>
          <path strokeLinecap='round' strokeLinejoin='round' d='M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5S2.25 12 2.25 12z' />
          <path strokeLinecap='round' strokeLinejoin='round' d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
        </svg>
      </button>

      {/* Botón circular sticky con icono de ojo, solo desktop, siempre visible */}
      <button
        type="button"
        className="hidden md:block fixed right-8 top-1/2 -translate-y-1/2 w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl shadow-lg border-4 border-white z-40 transition-all duration-300 hover:opacity-90 hover:scale-110"
        onClick={() => setShowPreviewMobile(true)}
        aria-label="Ver vista previa"
        style={{ 
          backgroundColor: color_personalizado,
          boxShadow: '0 8px 32px 0 rgba(0,0,0,0.15)' 
        }}
      >
        <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor' className='w-10 h-10 flex-shrink-0' style={{ display: 'block', margin: '0 auto' }}>
          <path strokeLinecap='round' strokeLinejoin='round' d='M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5S2.25 12 2.25 12z' />
          <path strokeLinecap='round' strokeLinejoin='round' d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
        </svg>
      </button>

      {/* Modal de vista previa */}
      {showPreviewMobile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-300 bg-opacity-80 backdrop-blur-sm p-2">
          <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 w-full h-full max-w-full max-h-full flex flex-col" style={{ 
            // En desktop, usar tamaño A4
            ...(!isMobile && {
              width: '8.5in',
              height: '11in',
              maxWidth: '98vw',
              maxHeight: '98vh',
              borderRadius: '16px'
            })
          }}>
            {/* Header del modal */}
            <div className="flex items-center justify-between p-3 md:p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-sm md:text-base font-semibold text-gray-800">Vista Previa de Factura</h3>
              <button
                className="w-7 h-7 md:w-8 md:h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-base md:text-lg font-bold shadow-lg transition-all duration-200 hover:scale-110"
                onClick={() => setShowPreviewMobile(false)}
                aria-label="Cerrar preview"
              >
                ×
              </button>
            </div>
            
            {/* Contenido del modal - SIN ZOOM, IDENTICO A LA FACTURA FINAL */}
            <div className="flex-1 overflow-y-auto overflow-x-auto p-0">
              <div className="w-full h-full" style={{
                // En móvil, mostrar sin zoom y sin padding
                ...(isMobile && {
                  padding: '0',
                  margin: '0',
                  transform: 'none',
                  zoom: '1',
                  transformOrigin: 'top left'
                })
              }}>
                <FacturaPreview factura={{
                  negocio: {
                    nombre: negocioConfig?.nombre_negocio,
                    direccion: negocioConfig?.direccion,
                    email: negocioConfig?.email,
                    telefono: negocioConfig?.telefono,
                    logo_url: negocioConfig?.logo_url,
                    nota: negocioConfig?.nota_factura,
                    color_personalizado: color_personalizado, // Agregar el color personalizado
                  },
                  numero_factura: numeroFactura,
                  nota: nota && nota.trim() !== '' ? nota : undefined,
                  terminos: terminos && terminos.trim() !== '' ? terminos : undefined,
                  cliente: clientes.find(c => c.id === clienteId) || { nombre: '', email: '', telefono: '' },
                  items: items.map(item => ({
                    ...item,
                    total: item.precio_unitario * item.cantidad // Asegurar que el total esté calculado correctamente
                  })),
                  subtotal,
                  impuesto: totalImpuesto,
                  total,
                  deposito,
                  balance_restante: balance,
                  fecha_factura: fechaFactura,
                  fecha_vencimiento: fechaVencimiento && fechaVencimiento.trim() !== '' ? fechaVencimiento : undefined,
                  estado: facturaEstado,
                }} mostrarStatus={editMode} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cliente */}
      <ClienteModal
        open={showClienteModal}
        onClose={() => setShowClienteModal(false)}
        onCreated={handleClienteCreated}
        color_personalizado={color_personalizado}
      />

      {/* Modal de Gestión de Categorías y Servicios */}
      <GestionCategoriasServiciosModal
        open={showServiciosModal}
        onClose={() => setShowServiciosModal(false)}
        onServicioCreated={handleServicioCreated}
      />
    </div>
  );
}