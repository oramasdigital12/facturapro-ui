import { Link } from 'react-router-dom';
import { UserGroupIcon, CurrencyDollarIcon, CalendarIcon, Cog6ToothIcon, DocumentTextIcon } from '@heroicons/react/24/solid';
import { useAuth, useDarkMode } from '../contexts/AuthContext';
import { useOutletContext } from 'react-router-dom';
import ValidarClienteModal from '../components/ValidarClienteModal';
import api from '../services/api';
import { useState, useEffect } from 'react';
import ClienteModal from '../components/ClienteModal';
import { FiMail } from 'react-icons/fi';

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
    title: 'Facturas',
    description: 'Facturación profesional',
    icon: DocumentTextIcon,
    href: '/facturas',
    color: 'text-indigo-500'
  },
  {
    title: 'Agenda',
    description: 'Tareas y recordatorios',
    icon: CalendarIcon,
    href: '/agenda',
    color: 'text-red-500'
  },
  {
    title: 'Información del Negocio',
    description: 'Ajustes y cuenta',
    icon: Cog6ToothIcon,
    href: '/configuracion',
    color: 'text-gray-500'
  },
  {
    title: 'Validar Cliente',
    description: 'Enviar email a validaciones',
    icon: FiMail,
    href: '',
    color: 'text-blue-400'
  }
];

export default function Home() {
  const { user } = useAuth();
  const [showValidarModal, setShowValidarModal] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [negocio, setNegocio] = useState({ nombre_negocio: '', email: '', logo_url: '' });
  const [clienteEditando, setClienteEditando] = useState<any>(null);
  const [showClienteModal, setShowClienteModal] = useState(false);
  const { dark } = useDarkMode();
  const outletContext = useOutletContext() as { color_personalizado?: string } | null;
  const color_personalizado = outletContext?.color_personalizado || '#2563eb';
  

  useEffect(() => {
    api.get('/api/clientes').then(res => setClientes(res.data));
    api.get('/api/negocio-config').then(res => setNegocio(res.data));
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
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

      <div className="relative flex-1 flex flex-col justify-center px-4 pb-24 md:pl-28">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img
              src={negocio.logo_url ? negocio.logo_url : '/logo.png'}
              alt="CRM Logo"
              className="w-16 h-16 object-contain rounded-xl bg-white dark:bg-slate-700 p-2 shadow-md mb-2"
              draggable={false}
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            Inicio
          </h1>
          <div className="w-16 h-1 mx-auto rounded-full" style={{ background: color_personalizado }}></div>
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto w-full md:max-w-lg md:gap-8 md:mt-8">
          {menuItems.map((item) => (
            item.title === 'Validar Cliente' ? (
              <button
                key={item.title}
                className="transform transition-all duration-300 hover:scale-105 w-full"
                onClick={() => setShowValidarModal(true)}
              >
                <div className="aspect-square bg-white dark:bg-gray-800 rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="h-full w-full p-4">
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <item.icon className={`h-10 w-10 mb-2 transition-colors duration-300 ${item.color}`} />
                      <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-0.5">{item.title}</h2>
                      <p className="text-xs leading-tight" style={{ color: color_personalizado }}>{item.description}</p>
                    </div>
                  </div>
                </div>
              </button>
            ) : (
              <Link
                key={item.title}
                to={item.href}
                className="transform transition-all duration-300 hover:scale-105"
              >
                <div className="aspect-square bg-white dark:bg-gray-800 rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="h-full w-full p-4">
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <item.icon className={`h-10 w-10 mb-2 transition-colors duration-300 ${item.color}`} />
                      <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-0.5">{item.title}</h2>
                      <p className="text-xs leading-tight" style={{ color: color_personalizado }}>{item.description}</p>
                    </div>
                  </div>
                </div>
              </Link>
            )
          ))}
        </div>
        {/* Sección de soporte */}
        <div className="flex flex-col items-center mt-10 gap-3 md:max-w-md md:mx-auto">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-blue-600 dark:text-blue-300">¿Tienes preguntas?</span>
            <span className="text-2xl">💬</span>
          </div>
          <a
            href={`https://wa.me/19392283101?text=${encodeURIComponent(`Hola, soy el usuario ${user?.email}. Tengo dudas.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-5 py-2 rounded-full shadow transition-all text-lg"
            style={{ boxShadow: '0 2px 8px rgba(39, 174, 96, 0.15)' }}
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.52 3.48A12.07 12.07 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.11.55 4.16 1.6 5.97L0 24l6.18-1.62A12.07 12.07 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.21-1.25-6.23-3.48-8.52zM12 22c-1.85 0-3.68-.5-5.25-1.45l-.37-.22-3.67.96.98-3.58-.24-.37A9.94 9.94 0 0 1 2 12c0-5.52 4.48-10 10-10s10 4.48 10 10-4.48 10-10 10zm5.2-7.8c-.28-.14-1.65-.81-1.9-.9-.25-.09-.43-.14-.61.14-.18.28-.28.9-.86 1.08-.16.18-.32.2-.6.07-.28-.14-1.18-.44-2.25-1.4-.83-.74-1.39-1.65-1.55-1.93-.16-.28-.02-.43.12-.57.13-.13.28-.34.42-.51.14-.17.18-.29.28-.48.09-.19.05-.36-.02-.5-.07-.14-.61-1.47-.84-2.01-.22-.53-.45-.46-.61-.47-.16-.01-.35-.01-.54-.01-.19 0-.5.07-.76.34-.26.27-1 1-.97 2.43.03 1.43 1.03 2.81 1.18 3.01.15.2 2.03 3.1 4.93 4.23.69.3 1.23.48 1.65.61.69.22 1.32.19 1.81.12.55-.08 1.65-.67 1.88-1.32.23-.65.23-1.21.16-1.32-.07-.11-.25-.18-.53-.32z"/>
            </svg>
            ¡Hablemos!
          </a>
        </div>
      </div>
      <ValidarClienteModal
        open={showValidarModal}
        onClose={() => setShowValidarModal(false)}
        clientes={clientes}
        nombreNegocio={negocio.nombre_negocio}
        emailNegocio={negocio.email}
        onEditCliente={(cliente) => {
          setClienteEditando(cliente);
          setShowClienteModal(true);
        }}
      />
      <ClienteModal
        open={showClienteModal}
        onClose={() => {
          setShowClienteModal(false);
          setShowValidarModal(true);
        }}
        onCreated={() => {
          api.get('/api/clientes').then(res => setClientes(res.data));
          setShowClienteModal(false);
          setShowValidarModal(true);
        }}
        cliente={clienteEditando}
      />
    </div>
  );
} 