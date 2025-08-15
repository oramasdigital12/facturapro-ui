import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { buildPDFUrl } from '../utils/urls';

export default function FacturaPDFPublica() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Obtener el ID de la factura del parámetro de la URL
    const facturaId = id || searchParams.get('id');
    
    if (facturaId) {
      // Redirigir al PDF usando la API interna
      const pdfUrl = buildPDFUrl(facturaId);
      window.location.href = pdfUrl;
    } else {
      setError('ID de factura no proporcionado');
    }
  }, [id, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center text-lg text-red-600">
          <div className="mb-4">❌ Error</div>
          <div className="text-sm">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center text-lg text-gray-700">
        <div className="mb-4">📄</div>
        <div>Redirigiendo a la factura PDF...</div>
        <div className="text-sm text-gray-500 mt-2">Por favor espera un momento</div>
      </div>
    </div>
  );
} 