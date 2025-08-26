import api from '../services/api';
import toast from 'react-hot-toast';

// Función para limpiar todos los mensajes existentes
export const limpiarMensajesExistentes = async () => {
  try {
    const response = await api.get('/api/mensajes');
    const mensajes = response.data;
    
    // Eliminar todos los mensajes existentes
    for (const mensaje of mensajes) {
      await api.delete(`/api/mensajes/${mensaje.id}`);
    }
    
    console.log(`Se eliminaron ${mensajes.length} mensajes existentes`);
    return true;
  } catch (error) {
    console.error('Error limpiando mensajes:', error);
    return false;
  }
};

// Función para crear mensajes de ejemplo para el módulo de clientes
export const crearMensajesEjemploClientes = async () => {
  const mensajesClientes = [
    {
      texto: "Hola {cliente}, esperamos que estés bien. ¿En qué podemos ayudarte hoy?",
      modulo: "clientes"
    },
    {
      texto: "¡Hola {cliente}! Gracias por contactarnos. Un representante se pondrá en contacto contigo pronto.",
      modulo: "clientes"
    },
    {
      texto: "Hola {cliente}, hemos recibido tu consulta. Te responderemos en las próximas 24 horas.",
      modulo: "clientes"
    },
    {
      texto: "¡Buenos días {cliente}! ¿Cómo podemos asistirte hoy?",
      modulo: "clientes"
    },
    {
      texto: "Hola {cliente}, gracias por tu interés en nuestros servicios. ¿Te gustaría agendar una cita?",
      modulo: "clientes"
    }
  ];

  try {
    for (const mensaje of mensajesClientes) {
      await api.post('/api/mensajes', mensaje);
    }
    
    console.log(`Se crearon ${mensajesClientes.length} mensajes de ejemplo para clientes`);
    return true;
  } catch (error) {
    console.error('Error creando mensajes de ejemplo para clientes:', error);
    return false;
  }
};

// Función para crear mensajes de ejemplo para el módulo de facturas
export const crearMensajesEjemploFacturas = async () => {
  const mensajesFacturas = [
    {
      texto: JSON.stringify({
        tipo: 'factura',
        categoria: 'pendiente',
        canal: 'whatsapp',
        plantilla: `Estimado/a cliente,

Adjunto encontrará su factura pendiente de pago:

📄 Factura #{numero}
💰 Monto Total: {monto}
⚖️ Saldo Pendiente: {saldo}

🔗 Acceso a la factura: {link_factura}

Para realizar el pago del saldo pendiente:
{instrucciones_pago}

Agradecemos su preferencia.
Saludos cordiales.`,
        contenido: `Estimado/a cliente,

Adjunto encontrará su factura pendiente de pago:

📄 Factura #{numero}
💰 Monto Total: {monto}
⚖️ Saldo Pendiente: {saldo}

🔗 Acceso a la factura: {link_factura}

Para realizar el pago del saldo pendiente:
{instrucciones_pago}

Agradecemos su preferencia.
Saludos cordiales.`,
        personalizado: false
      }),
      modulo: "facturas"
    },
    {
      texto: JSON.stringify({
        tipo: 'factura',
        categoria: 'pagada',
        canal: 'whatsapp',
        plantilla: `Estimado/a cliente,

Su factura ha sido pagada exitosamente:

📄 Factura #{numero}
💰 Monto Total: {monto}
✅ Estado: Pagada

🔗 Acceso a la factura: {link_factura}

Gracias por su pago.
Saludos cordiales.`,
        contenido: `Estimado/a cliente,

Su factura ha sido pagada exitosamente:

📄 Factura #{numero}
💰 Monto Total: {monto}
✅ Estado: Pagada

🔗 Acceso a la factura: {link_factura}

Gracias por su pago.
Saludos cordiales.`,
        personalizado: false
      }),
      modulo: "facturas"
    },
    {
      texto: JSON.stringify({
        tipo: 'factura',
        categoria: 'vencida',
        canal: 'whatsapp',
        plantilla: `Estimado/a cliente,

Su factura se encuentra vencida:

📄 Factura #{numero}
💰 Monto Total: {monto}
⚖️ Saldo Pendiente: {saldo}
⚠️ Estado: Vencida

🔗 Acceso a la factura: {link_factura}

Para realizar el pago del saldo pendiente:
{instrucciones_pago}

Le agradecemos ponerse al día con su pago.
Saludos cordiales.`,
        contenido: `Estimado/a cliente,

Su factura se encuentra vencida:

📄 Factura #{numero}
💰 Monto Total: {monto}
⚖️ Saldo Pendiente: {saldo}
⚠️ Estado: Vencida

🔗 Acceso a la factura: {link_factura}

Para realizar el pago del saldo pendiente:
{instrucciones_pago}

Le agradecemos ponerse al día con su pago.
Saludos cordiales.`,
        personalizado: false
      }),
      modulo: "facturas"
    }
  ];

  try {
    for (const mensaje of mensajesFacturas) {
      await api.post('/api/mensajes', mensaje);
    }
    
    console.log(`Se crearon ${mensajesFacturas.length} mensajes de ejemplo para facturas`);
    return true;
  } catch (error) {
    console.error('Error creando mensajes de ejemplo para facturas:', error);
    return false;
  }
};

// Función para ejecutar la migración completa
export const ejecutarMigracionCompleta = async () => {
  try {
    toast.loading('Iniciando migración de mensajes...');
    
    // Paso 1: Limpiar mensajes existentes
    const limpiezaExitosa = await limpiarMensajesExistentes();
    if (!limpiezaExitosa) {
      toast.error('Error limpiando mensajes existentes');
      return false;
    }
    
    // Paso 2: Crear mensajes de ejemplo para clientes
    const clientesExitoso = await crearMensajesEjemploClientes();
    if (!clientesExitoso) {
      toast.error('Error creando mensajes para clientes');
      return false;
    }
    
    // Paso 3: Crear mensajes de ejemplo para facturas
    const facturasExitoso = await crearMensajesEjemploFacturas();
    if (!facturasExitoso) {
      toast.error('Error creando mensajes para facturas');
      return false;
    }
    
    toast.success('Migración completada exitosamente');
    return true;
  } catch (error) {
    console.error('Error en migración completa:', error);
    toast.error('Error durante la migración');
    return false;
  }
};

// Función para verificar el estado de los mensajes
export const verificarEstadoMensajes = async () => {
  try {
    const [clientesResponse, facturasResponse] = await Promise.all([
      api.get('/api/mensajes/modulo/clientes'),
      api.get('/api/mensajes/modulo/facturas')
    ]);
    
    const mensajesClientes = clientesResponse.data;
    const mensajesFacturas = facturasResponse.data;
    
    console.log(`Mensajes de clientes: ${mensajesClientes.length}`);
    console.log(`Mensajes de facturas: ${mensajesFacturas.length}`);
    
    return {
      clientes: mensajesClientes.length,
      facturas: mensajesFacturas.length,
      total: mensajesClientes.length + mensajesFacturas.length
    };
  } catch (error) {
    console.error('Error verificando estado de mensajes:', error);
    return null;
  }
};
