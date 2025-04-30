import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/axios';
import toast from 'react-hot-toast';

export const TEMPLATE_VARIABLES = {
  CLIENTE_NOMBRE: '{cliente_nombre}',
  CLIENTE_TELEFONO: '{cliente_telefono}',
  NEGOCIO_NOMBRE: '{negocio_nombre}',
  FECHA: '{fecha}',
  HORA: '{hora}',
  VENCIMIENTO: '{fecha_vencimiento}',
  MONTO: '{monto}'
};

interface ConfigContextType {
  googleCalendarToken?: string;
  whatsappTemplates: WhatsappTemplate[];
  isGoogleCalendarConnected: boolean;
  connectGoogleCalendar: () => Promise<void>;
  disconnectGoogleCalendar: () => Promise<void>;
  saveWhatsappTemplate: (template: Omit<WhatsappTemplate, 'id'>) => Promise<void>;
  deleteWhatsappTemplate: (id: string) => Promise<void>;
  sendWhatsappMessage: (telefono: string, templateId: string, variables?: Record<string, string>) => Promise<void>;
  previewTemplate: (template: string, variables?: Record<string, string>) => string;
}

interface WhatsappTemplate {
  id: string;
  nombre: string;
  mensaje: string;
  created_at?: string;
  categoria?: 'vencimiento' | 'cumpleaños' | 'recordatorio' | 'general';
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [googleCalendarToken, setGoogleCalendarToken] = useState<string>();
  const [whatsappTemplates, setWhatsappTemplates] = useState<WhatsappTemplate[]>([]);
  const [isGoogleCalendarConnected, setIsGoogleCalendarConnected] = useState(false);

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  async function cargarConfiguracion() {
    try {
      const [configRes, templatesRes] = await Promise.all([
        api.get('/config'),
        api.get('/whatsapp/templates')
      ]);
      
      setGoogleCalendarToken(configRes.data.googleCalendarToken);
      setIsGoogleCalendarConnected(!!configRes.data.googleCalendarToken);
      setWhatsappTemplates(templatesRes.data);
    } catch (error) {
      console.error('Error al cargar configuración:', error);
    }
  }

  async function connectGoogleCalendar() {
    try {
      const clientId = '650533149280-lfqvbhcgergga3ta55gf2sk00aup74og.apps.googleusercontent.com';
      const redirectUri = `${window.location.origin}/auth/google/callback`;
      const scope = 'https://www.googleapis.com/auth/calendar';
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
      
      window.location.href = authUrl;
    } catch (error) {
      toast.error('Error al conectar con Google Calendar');
      console.error('Error:', error);
    }
  }

  async function disconnectGoogleCalendar() {
    try {
      await api.post('/config/google-calendar/disconnect');
      setGoogleCalendarToken(undefined);
      setIsGoogleCalendarConnected(false);
      toast.success('Desconectado de Google Calendar');
    } catch (error) {
      toast.error('Error al desconectar de Google Calendar');
      console.error('Error:', error);
    }
  }

  function previewTemplate(template: string, variables: Record<string, string> = {}) {
    let mensaje = template;
    
    // Reemplazar variables del sistema
    Object.entries(TEMPLATE_VARIABLES).forEach(([key, variable]) => {
      const value = variables[key] || variable;
      mensaje = mensaje.replace(new RegExp(variable, 'g'), value);
    });

    return mensaje;
  }

  async function saveWhatsappTemplate(template: Omit<WhatsappTemplate, 'id'>) {
    try {
      // Validar que el mensaje contenga al menos una variable
      const hasVariables = Object.values(TEMPLATE_VARIABLES).some(variable => 
        template.mensaje.includes(variable)
      );

      if (!hasVariables) {
        throw new Error('La plantilla debe contener al menos una variable');
      }

      const response = await api.post('/whatsapp/templates', template);
      setWhatsappTemplates([...whatsappTemplates, response.data]);
      toast.success('Plantilla guardada');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Error al guardar la plantilla');
      }
      console.error('Error:', error);
    }
  }

  async function deleteWhatsappTemplate(id: string) {
    try {
      await api.delete(`/whatsapp/templates/${id}`);
      setWhatsappTemplates(whatsappTemplates.filter(t => t.id !== id));
      toast.success('Plantilla eliminada');
    } catch (error) {
      toast.error('Error al eliminar la plantilla');
      console.error('Error:', error);
    }
  }

  async function sendWhatsappMessage(telefono: string, templateId: string, variables: Record<string, string> = {}) {
    try {
      const template = whatsappTemplates.find(t => t.id === templateId);
      if (!template) throw new Error('Plantilla no encontrada');

      const mensaje = previewTemplate(template.mensaje, variables);

      await api.post('/whatsapp/send', {
        telefono,
        mensaje,
        templateId,
        variables
      });
      
      toast.success('Mensaje enviado');
    } catch (error) {
      toast.error('Error al enviar mensaje');
      console.error('Error:', error);
    }
  }

  const value = {
    googleCalendarToken,
    whatsappTemplates,
    isGoogleCalendarConnected,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    saveWhatsappTemplate,
    deleteWhatsappTemplate,
    sendWhatsappMessage,
    previewTemplate
  };

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig debe usarse dentro de un ConfigProvider');
  }
  return context;
} 