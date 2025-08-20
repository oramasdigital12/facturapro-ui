import { useEffect, useState } from 'react';
import { getFacturaById } from '../services/api';
import { useParams } from 'react-router-dom';
import { buildPDFUrl } from '../utils/urls';
import { getNumeroFactura } from '../utils/facturaHelpers';

export default function FacturaDetalle() {
  const { id } = useParams();
  const [factura, setFactura] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validación de UUID
  const esUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id);

  useEffect(() => {
    if (id && esUUID(id)) {
      fetchFactura(id);
    } else {
      setError('ID de factura inválido.');
    }
    // eslint-disable-next-line
  }, [id]);

  const fetchFactura = async (facturaId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getFacturaById(facturaId);
      setFactura(res.data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar factura');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-8">Cargando...</div>;
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>;
  if (!factura) return <div className="text-center py-8 text-gray-500">Factura no encontrada.</div>;

  // Construir link público PDF
  const linkPublicoPDF = id ? buildPDFUrl(id) : '';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col md:items-center md:justify-center md:max-w-3xl md:mx-auto md:px-8 md:pl-28">
      <div className="w-full max-w-2xl mx-auto mt-8 mb-6 bg-white rounded-xl shadow p-4">
        {/* Botón grande para descargar PDF */}
        <div className="flex justify-end mb-4">
          <a href={linkPublicoPDF} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold text-lg hover:bg-blue-700 transition">Descargar PDF</a>
        </div>
        <h2 className="text-2xl font-bold mb-4 text-center">Factura #{getNumeroFactura(factura)}</h2>
        {/* Info del negocio y cliente */}
        <div className="flex flex-col md:flex-row md:justify-between mb-4">
          <div>
            <div className="font-bold text-lg">{factura.negocio?.nombre || 'Mi Negocio'}</div>
            <div className="text-xs text-gray-500">{factura.negocio?.email}</div>
            <div className="text-xs text-gray-500">{factura.negocio?.telefono}</div>
          </div>
          <div className="mt-2 md:mt-0">
            <div className="font-semibold text-sm">Cliente:</div>
            <div className={`text-sm ${!factura.cliente_id && factura.cliente?.nombre ? 'text-red-600' : ''}`}>
              {factura.cliente?.nombre || 'Cliente Eliminado'}
              {!factura.cliente_id && factura.cliente?.nombre && (
                <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                  Eliminado
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500">{factura.cliente?.email}</div>
            <div className="text-xs text-gray-500">{factura.cliente?.telefono}</div>
          </div>
        </div>
        {/* Fechas y estado */}
        <div className="flex gap-4 mb-4">
          <div className="text-xs text-gray-500">Fecha: {factura.fecha_factura}</div>
          {factura.fecha_vencimiento && factura.fecha_vencimiento !== '1999-99-99' && factura.fecha_vencimiento !== 'mm/dd/yyyy' && (
            <div className="text-xs text-gray-500">Vencimiento: {factura.fecha_vencimiento}</div>
          )}
          <div className="text-xs text-gray-500">Estado: <span className={factura.estado === 'pendiente' ? 'font-bold text-yellow-600' : factura.estado === 'pagada' ? 'font-bold text-green-600' : 'font-bold text-gray-600'}>{factura.estado}</span></div>
        </div>
        {/* Servicios/items */}
        <div className="mb-4">
          <div className="font-semibold mb-1">Servicios</div>
          <div className="bg-gray-50 rounded p-2 text-xs">
            {factura.items && factura.items.length > 0 ? (
              <ul>
                {factura.items.map((item: any, idx: number) => (
                  <li key={idx}>{item.descripcion} x{item.cantidad} - ${item.total?.toFixed(2)}</li>
                ))}
              </ul>
            ) : (
              <span className="text-xs text-gray-400">Sin items</span>
            )}
          </div>
        </div>
        {/* Totales */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div>Subtotal: <span className="font-semibold">${factura.subtotal?.toFixed(2)}</span></div>
          <div>Impuesto: <span className="font-semibold">${factura.impuesto?.toFixed(2)}</span></div>
          <div>Total: <span className="font-bold text-blue-700">${factura.total?.toFixed(2)}</span></div>
          <div>Depósito: <span className="font-semibold">${factura.deposito?.toFixed(2)}</span></div>
          <div>Balance: <span className="font-semibold">${factura.balance_restante?.toFixed(2)}</span></div>
        </div>
        {/* Nota y términos - solo mostrar si tienen contenido */}
        {factura.nota && factura.nota.trim() !== '' && (
          <div className="mb-4">
            <div className="font-semibold">Nota:</div>
            <div className="text-xs text-gray-500">{factura.nota}</div>
          </div>
        )}
        {factura.terminos && factura.terminos.trim() !== '' && (
          <div className="mb-4">
            <div className="font-semibold">Términos y condiciones:</div>
            <div className="text-xs text-gray-500">{factura.terminos}</div>
          </div>
        )}
      </div>
    </div>
  );
} 