// Funciones para manejar números de factura según la nueva API

/**
 * Obtiene el número de factura para mostrar (usa el campo formateado de la API)
 */
export const getNumeroFactura = (factura: any): string => {
  // Prioridad: numero_factura_formateado (nuevo campo de la API)
  if (factura?.numero_factura_formateado) {
    return factura.numero_factura_formateado;
  }
  
  // Fallback: otros campos posibles
  const numero = factura?.numero_factura || 
                 factura?.numeroFactura || 
                 factura?.numero || 
                 factura?.num || 
                 factura?.invoice_number ||
                 factura?.number;
                 
  if (!numero || numero === 'undefined' || numero === 'null') {
    return 'N/A';
  }
  return numero.toString();
};

/**
 * Obtiene el número de factura original para enviar al backend
 */
export const getNumeroFacturaOriginal = (factura: any): string => {
  const numero = factura?.numero_factura || 
                 factura?.numeroFactura || 
                 factura?.numero || 
                 factura?.num || 
                 factura?.invoice_number ||
                 factura?.number;
                 
  if (!numero || numero === 'undefined' || numero === 'null') {
    return '';
  }
  return numero.toString();
};

/**
 * Formatea un número de factura para mostrar (mantiene compatibilidad)
 */
export const formatNumeroFactura = (numero: string | number): string => {
  if (!numero || numero === 'undefined' || numero === 'null') {
    return 'N/A';
  }
  
  const numStr = numero.toString();
  
  // Si ya está en formato 100x, dejarlo como está
  if (numStr.startsWith('100')) {
    return numStr;
  }
  
  // Si es un número simple, convertirlo a formato 100x
  const num = parseInt(numStr);
  if (!isNaN(num)) {
    return `100${num}`;
  }
  
  return numStr;
};

/**
 * Calcula el siguiente número de factura
 */
export const getSiguienteNumeroFactura = (ultimaFactura: any): string => {
  if (!ultimaFactura) {
    return '1001'; // Primera factura
  }
  
  const ultimoNumero = getNumeroFacturaOriginal(ultimaFactura);
  
  if (!ultimoNumero || ultimoNumero === 'N/A') {
    return '1001';
  }
  
  // Si el último número ya está en formato 100x, incrementarlo
  if (ultimoNumero.startsWith('100')) {
    const num = parseInt(ultimoNumero.substring(3));
    if (!isNaN(num)) {
      return `100${num + 1}`;
    }
  }
  
  // Si es un número simple, convertirlo a formato 100x
  const num = parseInt(ultimoNumero);
  if (!isNaN(num)) {
    return `100${num + 1}`;
  }
  
  return '1001';
};

