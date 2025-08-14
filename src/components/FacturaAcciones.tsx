import { useState } from 'react';
import MensajeWhatsappModal from './MensajeWhatsappModal';
import EnviarEmailModal from './EnviarEmailModal';
import CompletarPagoModal from './CompletarPagoModal';
import { getClientes } from '../services/api';

type FacturaAccionesProps = {
  factura?: any;
  linkPublico?: string;
  onPagoCompletado?: () => void;
};

export default function FacturaAcciones({ factura, linkPublico, onPagoCompletado }: FacturaAccionesProps) {
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [showCompletarPago, setShowCompletarPago] = useState(false);
  const [clientes, setClientes] = useState<any[]>([]);

  // Cargar clientes para el modal de email
  const cargarClientes = async () => {
    try {
      const response = await getClientes();
      setClientes(response.data || []);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    }
  };

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
    setShowWhatsApp(true);
  };

  // Email
  const handleEmail = () => {
    cargarClientes();
    setShowEmail(true);
  };

  // Completar pago
  const handleCompletarPago = () => {
    setShowCompletarPago(true);
  };

  // Manejar edición de cliente en modal de email
  const handleEditCliente = (cliente: any, ids: string[]) => {
    // Aquí podrías implementar la lógica para editar el cliente
    console.log('Editar cliente:', cliente, 'IDs seleccionados:', ids);
  };

  return (
    <>
      <div className="flex flex-wrap gap-2 justify-end mt-2">
        <button className="px-3 py-2 rounded-xl bg-blue-100 text-blue-700 text-xs" onClick={() => window.print()}>🖨️ Imprimir</button>
        <button className="px-3 py-2 rounded-xl bg-gray-200 text-gray-700 text-xs" onClick={handleCopyText}>✉️ Copiar texto</button>
        <button className="px-3 py-2 rounded-xl bg-gray-200 text-gray-700 text-xs" onClick={handleCopyLink} disabled={!linkPublico}>🔗 Copiar link</button>
        <button 
          className="px-3 py-2 rounded-xl bg-green-100 text-green-700 text-xs" 
          onClick={handleWhatsApp} 
          disabled={!factura?.cliente?.telefono}
        >
          💬 WhatsApp
        </button>
        <button 
          className="px-3 py-2 rounded-xl bg-blue-100 text-blue-700 text-xs" 
          onClick={handleEmail}
        >
          📧 Email
        </button>
        {factura?.estado === 'pendiente' && (
          <button 
            className="px-3 py-2 rounded-xl bg-orange-100 text-orange-700 text-xs" 
            onClick={handleCompletarPago}
          >
            💳 Completar Pago
          </button>
        )}
      </div>

      {/* Modal de WhatsApp */}
      {showWhatsApp && factura?.cliente && (
        <MensajeWhatsappModal
          open={showWhatsApp}
          onClose={() => setShowWhatsApp(false)}
          cliente={factura.cliente}
          factura={factura}
        />
      )}

      {/* Modal de Email */}
      {showEmail && (
        <EnviarEmailModal
          open={showEmail}
          onClose={() => setShowEmail(false)}
          clientes={clientes}
          onEditCliente={handleEditCliente}
          factura={factura}
        />
      )}

      {/* Modal de Completar Pago */}
      {showCompletarPago && factura && (
        <CompletarPagoModal
          open={showCompletarPago}
          onClose={() => setShowCompletarPago(false)}
          factura={factura}
          onPagoCompletado={() => {
            if (onPagoCompletado) {
              onPagoCompletado();
            }
            setShowCompletarPago(false);
          }}
        />
      )}
    </>
  );
} 