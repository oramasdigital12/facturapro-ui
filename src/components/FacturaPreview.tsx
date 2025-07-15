type FacturaPreviewProps = {
  factura: any;
  mostrarStatus?: boolean;
};

export default function FacturaPreview({ factura, mostrarStatus }: FacturaPreviewProps) {
  const esPagada = factura?.estado === 'pagada';
  // Fallbacks desde la configuración del negocio
  const nombreNegocio = (factura?.negocio?.nombre || '-');
  const direccionNegocio = (factura?.negocio?.direccion || '-');
  const emailNegocio = (factura?.negocio?.email || '-');
  const telefonoNegocio = (factura?.negocio?.telefono || '-');
  const notaFactura = (factura?.nota || factura?.negocio?.nota || '-');
  const terminosFactura = (factura?.terminos || factura?.negocio?.terminos || '-');
  const numeroFactura = (factura?.numero_factura !== undefined && factura?.numero_factura !== null) ? factura.numero_factura : '-';
  return (
    <div className="w-full max-w-[850px] mx-auto bg-white rounded-xl shadow p-6 relative">
      {/* Sello de pagado */}
      {esPagada && mostrarStatus && (
        <div className="absolute top-8 right-8 bg-green-100 text-green-700 font-bold px-6 py-3 rounded-xl text-2xl rotate-12 shadow-lg opacity-80 z-10">
          PAGADO
        </div>
      )}
      {/* Encabezado: negocio y logo */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4 gap-3">
        <div className="flex flex-row items-center gap-3 w-full md:w-auto">
          {factura?.negocio?.logo_url && (
            <img src={factura.negocio.logo_url} alt="Logo" className="h-20 w-20 object-contain rounded bg-white border" />
          )}
          <div className="flex-1">
            <div className="font-bold text-xl mb-1">{nombreNegocio}</div>
            <div className="text-sm text-gray-700">{direccionNegocio}</div>
            <div className="text-sm text-gray-700">{emailNegocio}</div>
            <div className="text-sm text-gray-700">{telefonoNegocio}</div>
          </div>
        </div>
      </div>
      {/* Número y fecha de factura */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-1">
        <div className="text-base text-gray-700 font-semibold">Factura #{numeroFactura}</div>
        <div className="text-base text-gray-700 font-semibold">Fecha: {factura?.fecha_factura || '-'}</div>
      </div>
      {/* Datos del cliente */}
      <div className="mb-3">
        <div className="font-semibold text-base">Cliente:</div>
        <div className="text-base">{factura?.cliente?.nombre || '-'}</div>
        {factura?.cliente?.direccion && (
          <div className="text-sm text-gray-700">{factura.cliente.direccion}</div>
        )}
        {factura?.cliente?.email && (
          <div className="text-sm text-gray-700">{factura.cliente.email}</div>
        )}
        {factura?.cliente?.telefono && (
          <div className="text-sm text-gray-700">{factura.cliente.telefono}</div>
        )}
      </div>
      {/* Tabla de items */}
      <div className="my-4 overflow-x-auto rounded-md">
        <table className="w-full min-w-[500px] text-xs sm:text-sm border-t border-b border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              <th className="py-2 px-3 text-left">Descripción</th>
              <th className="py-2 px-3 text-left">Categoría</th>
              <th className="py-2 px-3 text-right">Precio Unitario</th>
              <th className="py-2 px-3 text-right">Cantidad</th>
              <th className="py-2 px-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {factura?.items?.length > 0 ? factura.items.map((item: any, idx: number) => (
              <tr key={idx} className="border-t border-gray-100">
                <td className="py-2 px-3">{item.descripcion}</td>
                <td className="py-2 px-3">{item.categoria}</td>
                <td className="py-2 px-3 text-right">${item.precio_unitario?.toFixed(2)}</td>
                <td className="py-2 px-3 text-right">{item.cantidad}</td>
                <td className="py-2 px-3 text-right">${item.total?.toFixed(2)}</td>
              </tr>
            )) : (
              <tr><td colSpan={5} className="text-center text-gray-400 py-4">Sin items</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Totales */}
      <div className="flex flex-col items-end gap-1 mb-3">
        <div className="text-base">Subtotal: <span className="font-semibold">${factura?.subtotal?.toFixed(2) || '0.00'}</span></div>
        <div className="text-base">Impuesto: <span className="font-semibold">${factura?.impuesto?.toFixed(2) || '0.00'}</span></div>
        <div className="text-base">Total: <span className="font-bold text-blue-700">${factura?.total?.toFixed(2) || '0.00'}</span></div>
        <div className="text-base">Depósito: <span className="font-semibold">${factura?.deposito?.toFixed(2) || '0.00'}</span></div>
        <div className="text-base">Balance: <span className="font-semibold">${factura?.balance_restante?.toFixed(2) || '0.00'}</span></div>
      </div>
      {/* Nota y términos */}
      <div className="mt-3">
        <div className="text-base mb-1"><span className="font-semibold">Nota:</span> {notaFactura}</div>
        <div className="text-base"><span className="font-semibold">Términos:</span> {terminosFactura}</div>
      </div>
      {/* Estado visual solo si mostrarStatus */}
      {mostrarStatus && (
        <div className="mt-4 flex justify-end">
          <span className={`text-base font-bold px-4 py-2 rounded-full ${esPagada ? 'bg-green-100 text-green-700' : factura?.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>{factura?.estado || '-'}</span>
        </div>
      )}
    </div>
  );
} 