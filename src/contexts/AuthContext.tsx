import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

interface User {
  id: string;
  email: string;
  nombre?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; fullName: string }) => Promise<void>;
  logout: () => void;
  checkBusinessInfoComplete: () => Promise<{ complete: boolean; missingFields: string[] }>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/api/auth/profile')
        .then(res => setUser(res.data))
        .catch(() => setUser(null))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const checkBusinessInfoComplete = async (): Promise<{ complete: boolean; missingFields: string[] }> => {
    try {
      const res = await api.get('/api/negocio-config');
      const negocioConfig = res.data;
      
      const requiredFields = [
        { key: 'nombre_negocio', label: 'Nombre del Negocio' },
        { key: 'tipo_negocio', label: 'Tipo de Negocio' },
        { key: 'telefono', label: 'Teléfono' },
        { key: 'email', label: 'Email' },
        { key: 'direccion', label: 'Dirección' }
      ];
      
      const missingFields: string[] = [];
      
      requiredFields.forEach(field => {
        const value = negocioConfig[field.key];
        if (!value || value.trim() === '') {
          missingFields.push(field.label);
        }
      });
      
      // Validar formato del teléfono (10 dígitos sin espacios)
      if (negocioConfig.telefono && !/^\d{10}$/.test(negocioConfig.telefono)) {
        missingFields.push('Teléfono (formato incorrecto)');
      }
      
      return {
        complete: missingFields.length === 0,
        missingFields
      };
    } catch (error) {
      console.error('Error checking business info:', error);
      return {
        complete: false,
        missingFields: ['Error al verificar información del negocio']
      };
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    const res = await api.post('/api/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    setLoading(false);
  };

  const register = async (data: { email: string; password: string; fullName: string }) => {
    setLoading(true);
    const res = await api.post('/api/auth/register', data);
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, checkBusinessInfoComplete }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

// CONTEXTO GLOBAL DE DARK MODE
interface DarkModeContextType {
  dark: boolean;
  setDark: React.Dispatch<React.SetStateAction<boolean>>;
}
const DarkModeContext = createContext<DarkModeContextType>({
  dark: false,
  setDark: () => {},
});

export function DarkModeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  return (
    <DarkModeContext.Provider value={{ dark, setDark }}>
      {children}
    </DarkModeContext.Provider>
  );
}

export function useDarkMode() {
  return useContext(DarkModeContext);
} 