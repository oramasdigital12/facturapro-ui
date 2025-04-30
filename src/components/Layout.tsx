import { Fragment } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  HomeIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon
} from '@heroicons/react/24/solid';

const navigation = [
  { name: 'Inicio', href: '/home', icon: HomeIcon },
  { name: 'Agenda', href: '/agenda', icon: CalendarIcon },
  { name: 'Clientes', href: '/clientes', icon: UserGroupIcon },
  { name: 'Ventas', href: '/ventas', icon: CurrencyDollarIcon },
  { name: 'Configuración', href: '/configuracion', icon: Cog6ToothIcon },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-md z-50">
        <div className="flex items-center justify-center gap-2 px-4 py-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className="relative flex flex-col items-center p-1.5 group"
              >
                <div className={`
                  p-2 rounded-xl transition-all duration-300 relative
                  ${isActive 
                    ? 'bg-blue-50' 
                    : 'hover:bg-gray-50'
                  }
                `}>
                  <item.icon
                    className={`h-5 w-5 transition-all duration-300 ${
                      isActive 
                        ? 'text-blue-500 scale-110' 
                        : 'text-gray-600 group-hover:text-blue-500'
                    }`}
                    aria-hidden="true"
                  />
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-blue-500 rounded-full" />
                  )}
                </div>
                <span className={`
                  text-[10px] font-medium mt-1 transition-colors duration-300
                  ${isActive ? 'text-blue-500' : 'text-gray-600 group-hover:text-blue-500'}
                `}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
} 