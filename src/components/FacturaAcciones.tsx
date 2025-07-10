type FacturaAccionesProps = {
  factura?: any;
  linkPublico?: string;
};

export default function FacturaAcciones({ factura, linkPublico }: FacturaAccionesProps) {
  // Copiar texto de factura
  const handleCopyText = () => {
    const texto = `Factura #${factura?.numero_factura}\nCliente: ${factura?.cliente?.nombre}\nTotal: $${factura?.total?.toFixed(2)}\nEstado: ${factura?.estado}\n${linkPublico ? `Ver factura: ${linkPublico}` : ''}`;
    navigator.clipboard.writeText(texto);
    alert('Texto de factura copiado');
  };

  // Copiar link público
  const handleCopyLink = () => {
    if (linkPublico) {
      navigator.clipboard.writeText(linkPublico);
      alert('Link de factura copiado');
    }
  };

  // WhatsApp
  const handleWhatsApp = () => {
    const texto = `Hola, aquí tienes tu factura:\nFactura #${factura?.numero_factura}\nTotal: $${factura?.total?.toFixed(2)}\n${linkPublico ? `Ver factura: ${linkPublico}` : ''}`;
    const telefono = factura?.cliente?.telefono ? factura.cliente.telefono.replace(/[^\d]/g, '') : '';
    const url = `https://wa.me/${telefono}?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="flex flex-wrap gap-2 justify-end mt-2">
      <button className="px-3 py-2 rounded-xl bg-blue-100 text-blue-700 text-xs" onClick={() => window.print()}>🖨️ Imprimir</button>
      <button className="px-3 py-2 rounded-xl bg-gray-200 text-gray-700 text-xs" onClick={handleCopyText}>✉️ Copiar texto</button>
      <button className="px-3 py-2 rounded-xl bg-gray-200 text-gray-700 text-xs" onClick={handleCopyLink} disabled={!linkPublico}>🔗 Copiar link</button>
      <button className="px-3 py-2 rounded-xl bg-green-100 text-green-700 text-xs" onClick={handleWhatsApp} disabled={!factura?.cliente?.telefono}>💬 WhatsApp</button>
    </div>
  );
} 