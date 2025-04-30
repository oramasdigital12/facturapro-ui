import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface GoogleCalendarContextType {
  isConnected: boolean;
  isLoading: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  createEvent: (event: CalendarEvent) => Promise<void>;
  createAutomaticEvents: (clienteId: string) => Promise<void>;
}

interface CalendarEvent {
  title: string;
  description?: string;
  start: string;
  end: string;
  allDay?: boolean;
  clienteId?: string;
  tipo: 'cumpleanos' | 'vencimiento' | 'recordatorio';
}

const GoogleCalendarContext = createContext<GoogleCalendarContextType | undefined>(undefined);

export function GoogleCalendarProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkConnection();
  }, []);

  async function checkConnection() {
    try {
      const response = await api.get('/google/calendar/status');
      setIsConnected(response.data.connected);
    } catch (error) {
      console.error('Error al verificar conexión con Google Calendar:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function connect() {
    try {
      const response = await api.get('/google/calendar/auth-url');
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Error al conectar con Google Calendar:', error);
      toast.error('Error al conectar con Google Calendar');
    }
  }

  async function disconnect() {
    try {
      await api.post('/google/calendar/disconnect');
      setIsConnected(false);
      toast.success('Desconectado de Google Calendar');
    } catch (error) {
      console.error('Error al desconectar de Google Calendar:', error);
      toast.error('Error al desconectar de Google Calendar');
    }
  }

  async function createEvent(event: CalendarEvent) {
    try {
      await api.post('/google/calendar/events', event);
      toast.success('Evento creado correctamente');
    } catch (error) {
      console.error('Error al crear evento:', error);
      toast.error('Error al crear el evento');
      throw error;
    }
  }

  async function createAutomaticEvents(clienteId: string) {
    try {
      await api.post(`/google/calendar/events/automatic/${clienteId}`);
      toast.success('Eventos automáticos creados correctamente');
    } catch (error) {
      console.error('Error al crear eventos automáticos:', error);
      toast.error('Error al crear los eventos automáticos');
      throw error;
    }
  }

  const value = {
    isConnected,
    isLoading,
    connect,
    disconnect,
    createEvent,
    createAutomaticEvents
  };

  return (
    <GoogleCalendarContext.Provider value={value}>
      {children}
    </GoogleCalendarContext.Provider>
  );
}

export function useGoogleCalendar() {
  const context = useContext(GoogleCalendarContext);
  if (context === undefined) {
    throw new Error('useGoogleCalendar debe usarse dentro de un GoogleCalendarProvider');
  }
  return context;
} 