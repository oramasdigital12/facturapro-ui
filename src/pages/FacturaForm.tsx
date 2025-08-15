import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { getClientes, getServiciosNegocio, createFactura, getFacturaById, updateFactura, getNegocioConfig, getUltimaFactura, getMetodosPago, regenerateFacturaPDF } from '../services/api';
import { clearFacturaCache } from '../utils/urls';
import FacturaPreview from '../components/FacturaPreview';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';

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

  const fetchNumeroSiguiente = async () => {
    try {
      const res = await getUltimaFactura();
      const ultima = res.data && res.data.length > 0 ? res.data[0] : null;
      setNumeroFactura(ultima && ultima.numero_factura ? ultima.numero_factura + 1 : 1);
    } catch {
      setNumeroFactura(1);
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

  // Eliminar item
  const handleDeleteItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Validación antes de enviar
  const validateForm = () => {
    const errors: {cliente?: string; items?: string; itemsDetalle?: string; fecha?: string; impuesto?: string; deposito?: string; nota?: string; terminos?: string; numero_factura?: string; fecha_vencimiento?: string} = {};
    
    // Validar cliente
    if (!clienteId) errors.cliente = 'Selecciona un cliente.';
    
    // Validar items
    if (items.length === 0) errors.items = 'Agrega al menos un servicio.';
    if (items.some(i => i.cantidad <= 0 || i.precio_unitario <= 0)) errors.itemsDetalle = 'Cantidad y precio deben ser mayores a 0.';
    
    // Validar fecha
    if (!fechaFactura) errors.fecha = 'La fecha de factura es obligatoria.';
    
    // Validar fecha de vencimiento (completamente opcional)
    if (fechaVencimiento && fechaVencimiento.trim() !== '') {
      const fechaVenc = new Date(fechaVencimiento);
      if (isNaN(fechaVenc.getTime())) {
        errors.fecha_vencimiento = 'La fecha de vencimiento debe ser válida.';
      }
    }
    
    // Validar impuesto
    if (impuesto === null || impuesto === undefined || impuesto < 0) errors.impuesto = 'El impuesto debe ser un número válido mayor o igual a 0.';
    
    // Validar depósito
    if (deposito === null || deposito === undefined || deposito < 0) errors.deposito = 'El depósito debe ser un número válido mayor o igual a 0.';
    
    // Validar nota
    if (!nota || nota.trim() === '') errors.nota = 'La nota es obligatoria.';
    
    // Validar términos
    if (!terminos || terminos.trim() === '') errors.terminos = 'Los términos son obligatorios.';
    
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
          terminos: negocioConfig?.terminos_condiciones,
        }, // Incluir datos completos del negocio
        fecha_factura: fechaFactura,
        fecha_vencimiento: fechaVencimiento && fechaVencimiento.trim() !== '' ? fechaVencimiento : null,
        numero_factura: editMode && id && facturaCargada ? facturaCargada.numero_factura : numeroFactura,
        subtotal,
        impuesto: totalImpuesto,
        total,
        deposito,
        balance_restante: balance,
        nota,
        terminos,
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
          terminos: negocioConfig?.terminos_condiciones,
        }, // Incluir datos completos del negocio
        fecha_factura: fechaFactura,
        fecha_vencimiento: fechaVencimiento && fechaVencimiento.trim() !== '' ? fechaVencimiento : null,
        numero_factura: editMode && id && facturaCargada ? facturaCargada.numero_factura : numeroFactura,
        subtotal,
        impuesto: totalImpuesto,
        total,
        deposito,
        balance_restante: balance,
        nota,
        terminos,
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
        <div className="flex items-center mb-2 md:mb-4">
          {/* Flecha back solo en móvil/tablet */}
          <button
            type="button"
            className="md:hidden mr-2 p-2 rounded-full bg-gray-100 hover:bg-gray-200 shadow"
            onClick={() => navigate('/facturas')}
            aria-label="Volver a facturas"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h2 className="text-2xl md:text-3xl font-bold text-center w-full">{editMode ? 'Editar Factura' : 'Nueva Factura'}</h2>
        </div>
        
        {error && <div className="text-red-500 text-center mb-2 text-base">{error}</div>}
        {success && <div className="text-green-600 text-center mb-2 text-base">{success}</div>}
        {editMode && facturaEstado === 'pagada' && (
          <div className="text-center text-yellow-700 bg-yellow-100 rounded p-2 mb-4 font-semibold">Esta factura está pagada y no puede ser editada.</div>
        )}

        {/* Cliente */}
        <div className="mb-4 relative cliente-dropdown">
          <label className="block text-sm font-semibold mb-2 text-gray-700">Cliente *</label>
          <div
            className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 text-base bg-white cursor-pointer ${formErrors.cliente ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-blue-300'}`}
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
                <div className="px-4 py-3 text-gray-500 text-base">No hay clientes</div>
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

        {/* Servicios / Items */}
        <div className="mb-2 relative servicio-dropdown">
          <label className="block text-base font-semibold mb-1">Servicios / Items *</label>
          <input
            type="text"
            className="mb-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 text-base w-full focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
            placeholder="Buscar servicio..."
            value={servicioSearch}
            onChange={e => {
              setServicioSearch(e.target.value);
              setShowServicioSuggestions(true);
            }}
            onFocus={() => setShowServicioSuggestions(true)}
            disabled={!isEditable}
            autoComplete="off"
          />
          {showServicioSuggestions && serviciosFiltrados.length > 0 && (
            <div className="absolute z-20 bg-white border rounded-2xl shadow max-h-52 overflow-y-auto w-full mt-1">
              {serviciosFiltrados.map(s => (
                <div
                  key={s.id}
                  className="px-4 py-3 hover:bg-blue-50 cursor-pointer text-base"
                  onClick={() => {
                    handleAddServicio(s.id);
                    setServicioSearch('');
                    setShowServicioSuggestions(false);
                  }}
                >
                  {s.nombre} (${s.precio})
                </div>
              ))}
            </div>
          )}
          
          {/* Items/servicios: tarjetas en móvil, tabla en desktop */}
          <div className="mb-2">
            <div className="font-semibold mb-2 text-base">Servicios / Items</div>
            {/* Vista de tarjetas apiladas en móvil */}
            <div className="flex flex-col gap-3 md:hidden">
              {items.length === 0 && <div className="text-gray-400 text-center py-4">Agrega servicios a la factura</div>}
              {items.map((item, idx) => (
                <div key={idx} className="bg-gray-50 rounded-2xl shadow border p-4 w-full flex flex-col gap-2 relative">
                  <div className="absolute top-2 right-2">
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(idx)}
                      className="text-xs px-3 py-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                    >
                      Eliminar
                    </button>
                  </div>
                  <div><span className="font-semibold">Descripción:</span> {item.descripcion}</div>
                  <div><span className="font-semibold">Categoría:</span> {item.categoria}</div>
                  <div><span className="font-semibold">Precio Unitario:</span> ${item.precio_unitario}</div>
                  <div><span className="font-semibold">Cantidad:</span> {item.cantidad}</div>
                  <div><span className="font-semibold">Total:</span> <span className="text-blue-700 font-bold">${item.total}</span></div>
                </div>
              ))}
            </div>
            
            {/* Tabla tradicional solo en desktop/tablet */}
            <div className="hidden md:block rounded-2xl border border-gray-200 bg-gray-50 relative">
              <table className="w-full text-base">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 font-semibold">Categoría</th>
                    <th className="p-3 font-semibold">Descripción</th>
                    <th className="p-3 font-semibold">Precio Unitario</th>
                    <th className="p-3 font-semibold">Cantidad</th>
                    <th className="p-3 font-semibold">Total</th>
                    <th className="p-3 font-semibold"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="p-3 whitespace-nowrap">{item.categoria}</td>
                      <td className="p-3 whitespace-nowrap">{item.descripcion}</td>
                      <td className="p-3 whitespace-nowrap">${item.precio_unitario}</td>
                      <td className="p-3 whitespace-nowrap">{item.cantidad}</td>
                      <td className="p-3 whitespace-nowrap">${item.total}</td>
                      <td className="p-3 whitespace-nowrap">
                        <button type="button" onClick={() => handleDeleteItem(idx)} className="text-xs px-3 py-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200">Eliminar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {formErrors.items && <div className="text-xs text-red-500 mt-1">{formErrors.items}</div>}
          {formErrors.itemsDetalle && <div className="text-xs text-red-500 mt-1">{formErrors.itemsDetalle}</div>}
        </div>

        {/* Layout moderno optimizado - flujo vertical eficiente */}
        <div className="space-y-6">
          {/* Número de factura, fecha de creación y fecha de vencimiento en una fila */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Número de Factura</label>
              <input 
                type="text" 
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 text-base ${formErrors.numero_factura ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-blue-400 focus:bg-blue-50'}`} 
                value={editMode && id && facturaCargada ? facturaCargada.numero_factura : numeroFactura} 
                onChange={e => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setNumeroFactura(value);
                  if (formErrors.numero_factura) setFormErrors({...formErrors, numero_factura: ''});
                }}
                placeholder="Número de factura"
              />
              {formErrors.numero_factura && <div className="text-xs text-red-500 mt-1">{formErrors.numero_factura}</div>}
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
              <input type="text" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-base font-medium" value={subtotal.toFixed(2)} readOnly />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Total</label>
              <input type="text" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-base font-medium text-blue-600" value={total.toFixed(2)} readOnly />
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
            <input type="text" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-base font-medium text-green-600" value={balance.toFixed(2)} readOnly />
          </div>

          {/* Nota y términos en una fila */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Nota *</label>
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
              <label className="block text-sm font-semibold mb-2 text-gray-700">Términos *</label>
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

          {/* Botones finales modernos */}
          <div className="flex flex-col gap-3 mt-8 md:flex-row md:gap-4 md:justify-end">
            <button
              type="button"
              className="w-full md:w-auto px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all duration-200 border-2 border-gray-200"
              onClick={handleCancelar}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="w-full md:w-auto px-6 py-3 rounded-xl bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 transition-all duration-200 border-2 border-blue-200"
              onClick={handleGuardarBorrador}
              disabled={loading}
            >
              Guardar borrador
            </button>
            <button
              type="submit"
              className="w-full md:w-auto px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              disabled={loading}
            >
              {editMode ? 'Actualizar factura' : 'Crear factura'}
            </button>
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
                    terminos: negocioConfig?.terminos_condiciones,
                  },
                  numero_factura: editMode && id && facturaCargada ? facturaCargada.numero_factura : numeroFactura,
                  nota,
                  terminos,
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
                  fecha_vencimiento: fechaVencimiento,
                  estado: facturaEstado,
                }} mostrarStatus={editMode} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 