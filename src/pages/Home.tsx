import { Link } from 'react-router-dom';
import { UserGroupIcon, CurrencyDollarIcon, CalendarIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const menuItems = [
  {
    title: 'Clientes',
    description: 'Gestiona tus clientes',
    icon: UserGroupIcon,
    href: '/clientes',
    color: 'text-blue-500'
  },
  {
    title: 'Ventas',
    description: 'Historial y exportación',
    icon: CurrencyDollarIcon,
    href: '/ventas',
    color: 'text-emerald-500'
  },
  {
    title: 'Agenda',
    description: 'Tareas y recordatorios',
    icon: CalendarIcon,
    href: '/agenda',
    color: 'text-red-500'
  },
  {
    title: 'Configuración',
    description: 'Ajustes y cuenta',
    icon: Cog6ToothIcon,
    href: '/configuracion',
    color: 'text-gray-500'
  }
];

export default function Home() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Wave decoration */}
      <div className="absolute inset-x-0 top-0 -z-10">
        <svg className="w-full h-48" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <defs>
            <linearGradient id="wave-gradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
          <path
            fill="url(#wave-gradient)"
            d="M0,96L48,112C96,128,192,160,288,186.7C384,213,480,235,576,218.7C672,203,768,149,864,128C960,107,1056,117,1152,128C1248,139,1344,149,1392,154.7L1440,160L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
          />
        </svg>
      </div>

      {/* Logout button */}
      <button
        type="button"
        onClick={() => handleLogout()}
        className="absolute top-4 right-4 p-2 rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer z-50"
        title="Cerrar sesión"
      >
        <ArrowRightOnRectangleIcon className="w-6 h-6 text-gray-400 group-hover:text-blue-500" />
      </button>

      <div className="relative flex-1 flex flex-col justify-center px-4 pb-24">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img
              src="/logo.png"
              alt="CRM Logo"
              className="w-24 h-24 object-contain animate-float"
              draggable={false}
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Inicio
          </h1>
          <div className="w-16 h-1 bg-blue-500 mx-auto rounded-full"></div>
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto w-full">
          {menuItems.map((item) => (
            <Link
              key={item.title}
              to={item.href}
              className="transform transition-all duration-300 hover:scale-105"
            >
              <div className="aspect-square bg-white rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="h-full w-full p-4">
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <item.icon className={`h-10 w-10 ${item.color} mb-2 transition-colors duration-300`} />
                    <h2 className="text-base font-semibold text-gray-800 mb-0.5">{item.title}</h2>
                    <p className="text-blue-500 text-xs leading-tight">{item.description}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
} 