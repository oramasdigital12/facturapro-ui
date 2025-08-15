// Utilidades para manejar URLs de PDF
export const buildPDFUrl = (facturaId: string): string => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const timestamp = new Date().getTime();
  return `${baseUrl}/api/facturas/${facturaId}/pdf/public?t=${timestamp}`;
};

export const buildPublicFacturaUrl = (facturaId: string, factura?: any): string => {
  // Usar un formato más legible: /factura/nombre-cliente/numero-factura
  // Pero mantener el ID original como parámetro para la API
  const nombreCliente = factura?.cliente?.nombre 
    ? factura.cliente.nombre.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
    : 'cliente';
  const numeroFactura = factura?.numero_factura || 'factura';
  
  return `https://vendedorpro.app/factura/${nombreCliente}/${numeroFactura}?id=${facturaId}`;
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

// Función para abrir WhatsApp de manera robusta en diferentes dispositivos
export const openWhatsApp = (phoneNumber: string, message: string) => {
  const numeroWhatsApp = phoneNumber.replace(/[^\d]/g, '');
  const mensajeCodificado = encodeURIComponent(message);
  const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${mensajeCodificado}`;
  
  // Detectar si es dispositivo móvil
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  try {
    if (isMobile) {
      // En móviles, usar location.href para mejor compatibilidad con web apps
      window.location.href = urlWhatsApp;
    } else {
      // En desktop, usar window.open
      window.open(urlWhatsApp, '_blank');
    }
    return true;
  } catch (error) {
    console.error('Error al abrir WhatsApp:', error);
    return false;
  }
};
