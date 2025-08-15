import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { buildPDFUrl } from '../utils/urls';

export default function FacturaPDFPublica() {
  const { id } = useParams();

  useEffect(() => {
    if (id) {
      window.location.href = buildPDFUrl(id);
    }
  }, [id]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center text-lg text-gray-700">Redirigiendo a la factura PDF...</div>
    </div>
  );
} 