import api from '../services/api';

// Tipos de mensajes predefinidos
export type TipoMensaje = 'pendiente' | 'pagada' | 'vencida' | 'por_vencer';
export type CanalMensaje = 'whatsapp' | 'email';

// Plantillas base para cada tipo de mensaje
export const PLANTILLAS_BASE = {
  pendiente: {
    whatsapp: `Estimado/a cliente,

Adjunto encontrará su factura pendiente de pago:

📄 Factura #{numero}
💰 Monto Total: {monto}
⚖️ Saldo Pendiente: {saldo}

🔗 Acceso a la factura: {link_factura}

Para realizar el pago del saldo pendiente:
{instrucciones_pago}

Agradecemos su preferencia y le recordamos que puede realizar el pago en cualquier momento.
Saludos cordiales.`,
    email: `Estimado/a cliente,

Adjunto encontrará su factura pendiente de pago:

📄 Factura #{numero}
💰 Monto Total: {monto}
⚖️ Saldo Pendiente: {saldo}

🔗 Acceso a la factura: {link_factura}

Para realizar el pago del saldo pendiente:
{instrucciones_pago}

Agradecemos su preferencia y le recordamos que puede realizar el pago en cualquier momento.
Saludos cordiales.`
  },
  pagada: {
    whatsapp: `Estimado/a cliente,

Su factura ha sido pagada exitosamente:

📄 Factura #{numero}
💰 Monto Total: {monto}
✅ Estado: Pagada

🔗 Acceso a la factura: {link_factura}

Gracias por su pago.
Saludos cordiales.`,
    email: `Estimado/a cliente,

Su factura ha sido pagada exitosamente:

📄 Factura #{numero}
💰 Monto Total: {monto}
✅ Estado: Pagada

🔗 Acceso a la factura: {link_factura}

Gracias por su pago.
Saludos cordiales.`
  },
  por_vencer: {
    whatsapp: `Estimado/a cliente,

Su factura está próxima a vencer y requiere atención inmediata:

📄 Factura #{numero}
💰 Monto Total: {monto}
⚖️ Saldo Pendiente: {saldo}
⏰ Estado: Por vencer

🔗 Acceso a la factura: {link_factura}

Para realizar el pago del saldo pendiente:
{instrucciones_pago}

⚠️ IMPORTANTE: Esta factura vence pronto. Le recomendamos realizar el pago antes de la fecha de vencimiento para evitar cargos adicionales.

Saludos cordiales.`,
    email: `Estimado/a cliente,

Su factura está próxima a vencer y requiere atención inmediata:

📄 Factura #{numero}
💰 Monto Total: {monto}
⚖️ Saldo Pendiente: {saldo}
⏰ Estado: Por vencer

🔗 Acceso a la factura: {link_factura}

Para realizar el pago del saldo pendiente:
{instrucciones_pago}

⚠️ IMPORTANTE: Esta factura vence pronto. Le recomendamos realizar el pago antes de la fecha de vencimiento para evitar cargos adicionales.

Saludos cordiales.`
  },
  vencida: {
    whatsapp: `Estimado/a cliente,

Su factura se encuentra VENCIDA y requiere atención URGENTE:

📄 Factura #{numero}
💰 Monto Total: {monto}
⚖️ Saldo Pendiente: {saldo}
🚨 Estado: VENCIDA

🔗 Acceso a la factura: {link_factura}

Para realizar el pago del saldo pendiente:
{instrucciones_pago}

🚨 URGENTE: Esta factura está vencida. Le solicitamos ponerse al día con su pago lo antes posible para evitar interrupciones en el servicio.

Saludos cordiales.`,
    email: `Estimado/a cliente,

Su factura se encuentra VENCIDA y requiere atención URGENTE:

📄 Factura #{numero}
💰 Monto Total: {monto}
⚖️ Saldo Pendiente: {saldo}
🚨 Estado: VENCIDA

🔗 Acceso a la factura: {link_factura}

Para realizar el pago del saldo pendiente:
{instrucciones_pago}

🚨 URGENTE: Esta factura está vencida. Le solicitamos ponerse al día con su pago lo antes posible para evitar interrupciones en el servicio.

Saludos cordiales.`
  }
};

// Función para generar el contenido del mensaje con datos de la factura
export const generarMensajeFactura = (
  plantilla: string,
  factura: any,
  linkFactura: string,
  linkPago?: string,
  descripcionPago?: string
): string => {
  const numero = factura.numero_factura_formateado || factura.numero_factura || 'N/A';
  const monto = factura.total ? `$${parseFloat(factura.total).toFixed(2)}` : '$0.00';
  
  // Para facturas pagadas, el saldo/balance es siempre 0
  const saldo = factura.estado === 'pagada' ? '$0.00' : 
    (factura.saldo_pendiente ? `$${parseFloat(factura.saldo_pendiente).toFixed(2)}` : monto);

  // Generar instrucciones de pago dinámicamente
  let instruccionesPago = '';
  
  // Verificar si el link es válido (no vacío, no por defecto)
  const linkValido = linkPago && 
    linkPago.trim() !== '' && 
    linkPago !== 'https://stripe.com/payments/link' &&
    !linkPago.includes('stripe.com/payments/link');
  
  if (linkValido && descripcionPago) {
    // Si tiene ambos: link válido y descripción
    instruccionesPago = `🔗 ${linkPago}\n\n📝 Instrucciones adicionales:\n${descripcionPago}`;
  } else if (linkValido && !descripcionPago) {
    // Solo tiene link válido (ej: Stripe real)
    instruccionesPago = `🔗 ${linkPago}`;
  } else if (!linkValido && descripcionPago) {
    // Solo tiene descripción (ej: ATH Móvil)
    instruccionesPago = `📝 Instrucciones:\n${descripcionPago}`;
  } else {
    // No tiene ninguno (fallback)
    instruccionesPago = '🔗 https://stripe.com/payments/link';
  }

  // Manejar reemplazos individuales (compatibilidad hacia atrás)
  const contenidoLinkPago = linkPago || 'https://stripe.com/payments/link';
  const contenidoDescripcion = descripcionPago || '';

  return plantilla
    .replace(/{numero}/g, numero)
    .replace(/{monto}/g, monto)
    .replace(/{saldo}/g, saldo)
    .replace(/{balance}/g, saldo) // {balance} es lo mismo que {saldo}
    .replace(/{link_factura}/g, linkFactura)
    .replace(/{link_pago}/g, contenidoLinkPago)
    .replace(/{descripcion}/g, contenidoDescripcion)
    .replace(/{instrucciones_pago}/g, instruccionesPago);
};

// Función para crear mensaje predefinido automáticamente
export const crearMensajePredefinido = async (
  tipo: TipoMensaje,
  canal: CanalMensaje,
  factura: any,
  linkFactura: string,
  linkPago?: string,
  descripcionPago?: string
) => {
  try {
    const plantilla = PLANTILLAS_BASE[tipo][canal];
    const contenido = generarMensajeFactura(plantilla, factura, linkFactura, linkPago, descripcionPago);
    
    // Crear estructura del mensaje
    const mensajeData = {
      tipo: 'factura',
      categoria: tipo,
      canal: canal,
      plantilla: plantilla,
      contenido: contenido,
      personalizado: false,
      factura_id: factura.id
    };

    const response = await api.post('/api/mensajes', {
      texto: JSON.stringify(mensajeData),
      modulo: 'facturas'
    });

    return response.data;
  } catch (error) {
    console.error('Error creando mensaje predefinido:', error);
    throw error;
  }
};

// Función para obtener mensaje predefinido existente
export const obtenerMensajePredefinido = async (
  tipo: TipoMensaje,
  canal: CanalMensaje
): Promise<any> => {
  try {
    const response = await api.get('/api/mensajes/modulo/facturas');
    const mensajes = response.data;
    
    // Buscar mensaje que coincida con el tipo y canal
    return mensajes.find((mensaje: any) => {
      try {
        const data = JSON.parse(mensaje.texto);
        return data.tipo === 'factura' && data.categoria === tipo && data.canal === canal;
      } catch {
        return false;
      }
    });
  } catch (error) {
    console.error('Error obteniendo mensaje predefinido:', error);
    return null;
  }
};

// Función para actualizar mensaje predefinido
export const actualizarMensajePredefinido = async (
  mensajeId: string,
  contenido: string,
  personalizado: boolean = true
) => {
  try {
    const mensajeActual = await api.get(`/api/mensajes/${mensajeId}`);
    const dataActual = JSON.parse(mensajeActual.data.texto);
    
    const dataActualizada = {
      ...dataActual,
      contenido: contenido,
      personalizado: personalizado
    };

    const response = await api.put(`/api/mensajes/${mensajeId}`, {
      texto: JSON.stringify(dataActualizada)
    });

    return response.data;
  } catch (error) {
    console.error('Error actualizando mensaje predefinido:', error);
    throw error;
  }
};

// Función para obtener mensajes por módulo
export const obtenerMensajesPorModulo = async (modulo: string): Promise<any[]> => {
  try {
    const response = await api.get(`/api/mensajes/modulo/${modulo}`);
    return response.data;
  } catch (error) {
    console.error(`Error obteniendo mensajes del módulo ${modulo}:`, error);
    return [];
  }
};

// Función para crear mensaje simple (para clientes)
export const crearMensajeSimple = async (texto: string, modulo: string): Promise<any> => {
  try {
    const response = await api.post('/api/mensajes', {
      texto: texto,
      modulo: modulo
    });
    return response.data;
  } catch (error) {
    console.error('Error creando mensaje simple:', error);
    throw error;
  }
};

// Función para generar mensaje con datos actuales de factura
export const generarMensajeConDatosActuales = (
  mensajePredefinido: any,
  factura: any,
  linkFactura: string,
  linkPago?: string,
  descripcionPago?: string
): string => {
  try {
    const data = JSON.parse(mensajePredefinido.texto);
    
    if (data.personalizado) {
      // Si está personalizado, usar el contenido guardado pero reemplazar datos dinámicos
      let contenido = data.contenido;
      
      // MIGRACIÓN: Si el contenido tiene la estructura antigua, migrarlo automáticamente
      if (contenido.includes('Para realizar el pago del saldo pendiente, utilice el siguiente enlace:') && 
          contenido.includes('{link_pago}') && 
          contenido.includes('{descripcion}')) {
        
        // Migrar a la nueva estructura
        contenido = contenido.replace(
          /Para realizar el pago del saldo pendiente, utilice el siguiente enlace:\s*🔗\s*\{link_pago\}\s*📝\s*Instrucciones adicionales:\s*\{descripcion\}/g,
          'Para realizar el pago del saldo pendiente:\n{instrucciones_pago}'
        );
        
        // Actualizar el mensaje guardado automáticamente
        setTimeout(async () => {
          try {
            await actualizarMensajePredefinido(mensajePredefinido.id, contenido, true);
            console.log('Mensaje migrado automáticamente a nueva estructura');
          } catch (error) {
            console.warn('Error migrando mensaje:', error);
          }
        }, 0);
      }
      
      return generarMensajeFactura(contenido, factura, linkFactura, linkPago, descripcionPago);
    } else {
      // Si no está personalizado, usar la plantilla base
      const plantilla = PLANTILLAS_BASE[data.categoria as TipoMensaje][data.canal as CanalMensaje];
      return generarMensajeFactura(plantilla, factura, linkFactura, linkPago, descripcionPago);
    }
  } catch (error) {
    console.error('Error generando mensaje con datos actuales:', error);
    // Fallback a plantilla base
    const plantilla = PLANTILLAS_BASE.pendiente.whatsapp;
    return generarMensajeFactura(plantilla, factura, linkFactura, linkPago);
  }
};
