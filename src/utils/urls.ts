// Utilidades para manejar URLs de PDF
export const buildPDFUrl = (facturaId: string): string => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const timestamp = new Date().getTime();
  return `${baseUrl}/api/facturas/${facturaId}/pdf/public?t=${timestamp}`;
};

export const buildPublicFacturaUrl = (facturaId: string): string => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  return `${baseUrl}/factura/${facturaId}`;
};

// Función para limpiar caché del navegador para una factura específica
export const clearFacturaCache = (facturaId: string) => {
  // Limpiar cache del navegador para evitar problemas con facturas actualizadas
  console.log(`Limpiando cache para factura: ${facturaId}`);
  if ('caches' in window) {
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => {
        caches.delete(cacheName);
      });
    });
  }
};
