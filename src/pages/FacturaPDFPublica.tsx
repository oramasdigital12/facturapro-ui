import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { buildPDFUrl } from '../utils/urls';

export default function FacturaPDFPublica() {
  const { id } = useParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      // Redirigir al PDF usando la API interna
      const pdfUrl = buildPDFUrl(id);
      window.location.href = pdfUrl;
    } else {
      setError('ID de factura no proporcionado');
    }
  }, [id]);

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