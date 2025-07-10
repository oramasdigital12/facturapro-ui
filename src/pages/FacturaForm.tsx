import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getClientes, getServiciosNegocio, createFactura, getFacturaById, updateFactura, getNegocioConfig, getUltimaFactura } from '../services/api';
import FacturaPreview from '../components/FacturaPreview';
import Swal from 'sweetalert2';

export default function FacturaForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  // Estado de clientes y servicios
  const [clientes, setClientes] = useState<any[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{cliente?: string; items?: string; itemsDetalle?: string}>({});
  const [facturaEstado, setFacturaEstado] = useState<string>('');
  const [editMode, setEditMode] = useState(false);
  const [negocioConfig, setNegocioConfig] = useState<any>(null);
  const [numeroFactura, setNumeroFactura] = useState<string | number>('-');
  const [facturaCargada, setFacturaCargada] = useState<any>(null);

  // Estado del formulario
  const [clienteId, setClienteId] = useState('');
  const [fechaFactura, setFechaFactura] = useState(() => new Date().toISOString().slice(0, 10));
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
      setItems([...items, {
        categoria: servicio.categoria || '',
        descripcion: servicio.nombre,
        precio_unitario: servicio.precio,
        cantidad: 1,
        total: servicio.precio
      }]);
    }
  };

  // Eliminar item
  const handleDeleteItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Validación antes de enviar
  const validateForm = () => {
    const errors: {cliente?: string; items?: string; itemsDetalle?: string} = {};
    if (!clienteId) errors.cliente = 'Selecciona un cliente.';
    if (items.length === 0) errors.items = 'Agrega al menos un servicio.';
    if (items.some(i => i.cantidad <= 0 || i.precio_unitario <= 0)) errors.itemsDetalle = 'Cantidad y precio deben ser mayores a 0.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Confirmar antes de crear/actualizar
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    setError(null);
    setSuccess(null);
    if (!validateForm()) return;
    setLoading(true);
    try {
      const body = {
        cliente_id: clienteId,
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
      } else {
        await createFactura(body);
        setClienteId('');
        setItems([]);
        setImpuesto(0);
        setDeposito(0);
        setNota('');
        setTerminos('');
        setFormErrors({});
      }
      await Swal.fire({
        title: '¡Éxito!',
        text: editMode ? 'Factura actualizada exitosamente' : 'Factura creada exitosamente',
        icon: 'success',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'OK'
      });
      navigate('/facturas');
    } catch (err: any) {
      setError(err.message || 'Error al guardar factura');
    } finally {
      setLoading(false);
    }
  };

  // Guardar como borrador
  const handleGuardarBorrador = async () => {
    const result = await Swal.fire({
      title: '¿Guardar como borrador?',
      text: '¿Deseas guardar esta factura como borrador?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, guardar',
      cancelButtonText: 'Cancelar'
    });
    if (!result.isConfirmed) return;
    setError(null);
    setSuccess(null);
    if (!validateForm()) return;
    setLoading(true);
    try {
      const body = {
        cliente_id: clienteId,
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
        setFormErrors({});
      }
      await Swal.fire({
        title: '¡Éxito!',
        text: 'Factura guardada como borrador',
        icon: 'success',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'OK'
      });
      navigate('/facturas');
    } catch (err: any) {
      setError(err.message || 'Error al guardar como borrador');
    } finally {
      setLoading(false);
    }
  };

  // Confirmar antes de cancelar
  const handleCancelar = async () => {
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

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col w-full md:items-center md:justify-center md:max-w-3xl md:mx-auto md:px-8 md:pl-28">
      {/* Botón cerrar (solo desktop) */}
      <button
        type="button"
        className="hidden md:block absolute top-6 right-8 text-gray-400 hover:text-red-500 text-3xl z-20"
        onClick={() => navigate('/facturas')}
        aria-label="Cerrar"
      >
        &times;
      </button>
      <form className="w-full mx-0 p-0 bg-white md:rounded-xl md:shadow md:max-w-2xl md:mx-auto md:p-4" onSubmit={handleSubmit}>
        <div className="flex items-center mb-4">
          {/* Flecha back solo en móvil/tablet */}
          <button
            type="button"
            className="md:hidden mr-2 p-1 rounded hover:bg-gray-100"
            onClick={() => navigate('/facturas')}
            aria-label="Volver a facturas"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h2 className="text-xl md:text-2xl font-bold text-center w-full">{editMode ? 'Editar Factura' : 'Nueva Factura'}</h2>
        </div>
        {error && <div className="text-red-500 text-center mb-2">{error}</div>}
        {success && <div className="text-green-600 text-center mb-2">{success}</div>}
        {editMode && facturaEstado === 'pagada' && (
          <div className="text-center text-yellow-700 bg-yellow-100 rounded p-2 mb-4 font-semibold">Esta factura está pagada y no puede ser editada.</div>
        )}
        {/* Selección de cliente con autocomplete */}
        <div className="mb-4 relative">
          <label className="block text-sm font-semibold mb-1">Cliente</label>
          <input
            type="text"
            className="w-full px-3 py-2 rounded-xl border shadow-sm"
            value={clienteSearch || clientes.find(c => c.id === clienteId)?.nombre || ''}
            onChange={e => { setClienteSearch(e.target.value); setShowClienteSuggestions(true); }}
            onFocus={() => setShowClienteSuggestions(true)}
            autoComplete="off"
            placeholder="Buscar cliente..."
          />
          {showClienteSuggestions && clientesFiltrados.length > 0 && (
            <div className="absolute z-10 bg-white border rounded-xl shadow max-h-40 overflow-y-auto w-full mt-1">
              {clientesFiltrados.map(c => (
                <div
                  key={c.id}
                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                  onClick={() => {
                    setClienteId(c.id);
                    setClienteSearch(c.nombre);
                    setShowClienteSuggestions(false);
                  }}
                >
                  {c.nombre}
                </div>
              ))}
            </div>
          )}
          {formErrors.cliente && <div className="text-xs text-red-500 mt-1">{formErrors.cliente}</div>}
        </div>
        {/* Selección de servicios/items con autocomplete */}
        <div className="mb-4 relative">
          <label className="block text-sm font-semibold mb-1">Servicios / Items</label>
          <input
            type="text"
            className="mb-2 px-3 py-1 rounded bg-blue-100 text-blue-700 text-xs w-full"
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
            <div className="absolute z-10 bg-white border rounded-xl shadow max-h-40 overflow-y-auto w-full mt-1">
              {serviciosFiltrados.map(s => (
                <div
                  key={s.id}
                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-xs"
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
          <div className="mb-4">
            <div className="font-semibold mb-1">Servicios / Items</div>
            {/* Vista de tarjetas apiladas en móvil */}
            <div className="flex flex-col gap-3 md:hidden">
              {items.map((item, idx) => (
                <div key={idx} className="bg-white rounded-xl shadow border p-3 w-full flex flex-col gap-1">
                  <div><span className="font-semibold">Descripción:</span> {item.descripcion}</div>
                  <div><span className="font-semibold">Categoría:</span> {item.categoria}</div>
                  <div><span className="font-semibold">Precio Unitario:</span> ${item.precio_unitario}</div>
                  <div><span className="font-semibold">Cantidad:</span> {item.cantidad}</div>
                  <div><span className="font-semibold">Total:</span> <span className="text-blue-700 font-bold">${item.total}</span></div>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(idx)}
                    className="text-xs px-3 py-1 rounded bg-red-100 text-red-600 hover:bg-red-200 w-full mt-2"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
            {/* Tabla tradicional solo en desktop/tablet */}
            <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200 bg-gray-50 relative">
              <table className="min-w-[600px] w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 font-semibold">Categoría</th>
                    <th className="p-2 font-semibold">Descripción</th>
                    <th className="p-2 font-semibold">Precio Unitario</th>
                    <th className="p-2 font-semibold">Cantidad</th>
                    <th className="p-2 font-semibold">Total</th>
                    <th className="p-2 font-semibold"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="p-2 whitespace-nowrap">{item.categoria}</td>
                      <td className="p-2 whitespace-nowrap">{item.descripcion}</td>
                      <td className="p-2 whitespace-nowrap">${item.precio_unitario}</td>
                      <td className="p-2 whitespace-nowrap">{item.cantidad}</td>
                      <td className="p-2 whitespace-nowrap">${item.total}</td>
                      <td className="p-2 whitespace-nowrap">
                        <button type="button" onClick={() => handleDeleteItem(idx)} className="text-xs px-2 py-1 rounded bg-red-100 text-red-600 hover:bg-red-200">Eliminar</button>
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
        {/* Fechas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Fecha de factura</label>
            <input type="date" className="w-full px-3 py-2 rounded-xl border shadow-sm" value={fechaFactura} onChange={e => setFechaFactura(e.target.value)} />
          </div>
        </div>
        {/* Subtotal, impuesto, total, depósito, balance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Subtotal</label>
            <input type="text" className="w-full px-3 py-2 rounded-xl border shadow-sm" value={subtotal.toFixed(2)} readOnly />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Impuesto (%)</label>
            <input type="number" className="w-full px-3 py-2 rounded-xl border shadow-sm" value={impuesto} onChange={e => setImpuesto(Number(e.target.value))} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Total</label>
            <input type="text" className="w-full px-3 py-2 rounded-xl border shadow-sm" value={total.toFixed(2)} readOnly />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Depósito recibido</label>
            <input type="number" className="w-full px-3 py-2 rounded-xl border shadow-sm" value={deposito} onChange={e => setDeposito(Number(e.target.value))} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Balance restante</label>
            <input type="text" className="w-full px-3 py-2 rounded-xl border shadow-sm" value={balance.toFixed(2)} readOnly />
          </div>
        </div>
        {/* Nota y términos */}
        <div className="mb-4">
          <label className="block text-xs font-semibold mb-1">Nota</label>
          <textarea className="w-full px-3 py-2 rounded-xl border shadow-sm" value={nota} onChange={e => setNota(e.target.value)} />
        </div>
        <div className="mb-4">
          <label className="block text-xs font-semibold mb-1">Términos</label>
          <textarea className="w-full px-3 py-2 rounded-xl border shadow-sm" value={terminos} onChange={e => setTerminos(e.target.value)} />
        </div>
        {/* Eliminar u ocultar el bloque de logo y firma */}
        {/* Vista previa en tiempo real */}
        <div className="mt-6">
          <div className="font-semibold mb-2">Vista previa en tiempo real</div>
          <FacturaPreview factura={{
            ...{
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
              cliente: clientes.find(c => c.id === clienteId) || {},
              items,
              subtotal,
              impuesto: totalImpuesto,
              total,
              deposito,
              balance_restante: balance,
              fecha_factura: fechaFactura,
              estado: facturaEstado,
            }
          }} mostrarStatus={editMode} />
        </div>
        {/* Botones finales */}
        <div className="flex flex-col md:flex-row gap-2 mt-6">
          <button
            type="button"
            className="w-full md:w-auto px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300"
            onClick={handleCancelar}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="w-full md:w-auto px-4 py-2 rounded bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200"
            onClick={handleGuardarBorrador}
            disabled={loading}
          >
            Guardar borrador
          </button>
          <button
            type="submit"
            className="w-full md:w-auto px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700"
            disabled={loading}
          >
            {editMode ? 'Actualizar factura' : 'Crear factura'}
          </button>
        </div>
      </form>
    </div>
  );
} 