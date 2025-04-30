import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  nombre: string;
  negocio: string;
  tipo_negocio: string;
  direccion: string;
  telefono: string;
  trial_ends_at: string | null;
  subscription_status: 'trial' | 'active' | 'cancelled' | 'expired';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, nombre: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Exportamos el hook como una constante para hacerlo compatible con Fast Refresh
const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};

export { useAuth };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
    } catch (error) {
      console.error('No autenticado:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    try {
      const response = await api.post('/auth/login', { email, password });
      setUser(response.data.user);
      localStorage.setItem('token', response.data.token);
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      toast.success('Sesión iniciada correctamente');
    } catch (error) {
      toast.error('Error al iniciar sesión');
      throw error;
    }
  }

  async function register(email: string, password: string, nombre: string) {
    try {
      const response = await api.post('/auth/register', { email, password, nombre });
      setUser(response.data.user);
      localStorage.setItem('token', response.data.token);
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      toast.success('Cuenta creada correctamente');
    } catch (error) {
      toast.error('Error al crear la cuenta');
      throw error;
    }
  }

  async function logout() {
    try {
      await api.post('/auth/logout');
      setUser(null);
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      toast.success('Sesión cerrada correctamente');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }

  async function updateProfile(data: Partial<User>) {
    try {
      const response = await api.put('/auth/profile', data);
      setUser(response.data);
      toast.success('Perfil actualizado correctamente');
    } catch (error) {
      toast.error('Error al actualizar el perfil');
      throw error;
    }
  }

  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 