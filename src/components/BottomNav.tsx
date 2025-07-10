import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiUsers, FiDollarSign, FiCalendar, FiFileText } from 'react-icons/fi';

const navItems = [
  { to: '/home', icon: <FiHome />, label: 'Inicio' },
  { to: '/clientes', icon: <FiUsers />, label: 'Clientes' },
  { to: '/agenda', icon: <FiCalendar />, label: 'Tareas' },
   { to: '/facturas', icon: <FiFileText />, label: 'Facturas' },
  { to: '/ventas', icon: <FiDollarSign />, label: 'Ventas' },
 
];

interface BottomNavProps {
  color_personalizado?: string;
}

export default function BottomNav({ color_personalizado = '#2563eb' }: BottomNavProps) {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t shadow-lg flex justify-around items-center h-16 z-50 md:static md:h-auto md:shadow-none md:border-none md:bg-transparent">
      {navItems.map(item => {
        const isActive = location.pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={`flex flex-col items-center justify-center text-xs font-medium transition-colors relative ${isActive ? '' : 'text-gray-500 dark:text-gray-300'}`}
            style={isActive ? { color: color_personalizado } : {}}
          >
            <span className="text-xl mb-1" style={isActive ? { color: color_personalizado } : {}}>{item.icon}</span>
            {item.label}
            {isActive && (
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full" style={{ background: color_personalizado }} />
            )}
          </Link>
        );
      })}
    </nav>
  );
} 