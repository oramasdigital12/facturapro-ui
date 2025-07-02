import { Link, useLocation } from 'react-router-dom';
import { FiUsers, FiDollarSign, FiSettings, FiCalendar, FiMail } from 'react-icons/fi';
import { useEffect, useState } from 'react';
import api from '../services/api';

interface SidebarNavProps {
  className?: string;
  onValidarClienteClick: () => void;
}

const navItems = [
  { to: '/clientes', icon: <FiUsers />, label: 'Clientes', color: 'text-blue-500', desc: 'Gestiona tus clientes' },
  { to: '/agenda', icon: <FiCalendar />, label: 'Tareas', color: 'text-red-500', desc: 'Tareas y recordatorios' },
  { to: '/ventas', icon: <FiDollarSign />, label: 'Ventas', color: 'text-emerald-500', desc: 'Historial y exportación' },
  { to: '/configuracion', icon: <FiSettings />, label: 'Información del Negocio', color: 'text-gray-500', desc: 'Ajustes y cuenta' },
];

export default function SidebarNav({ className = '', onValidarClienteClick }: SidebarNavProps) {
  const location = useLocation();
  const [negocio, setNegocio] = useState({ logo_url: '' });

  useEffect(() => {
    api.get('/api/negocio-config').then(res => setNegocio(res.data));
  }, []);

  return (
    <aside
      className={`hidden md:flex flex-col min-h-screen py-10 px-4 w-80 z-40 relative ${className}`}
      style={{
        background: 'linear-gradient(135deg, #182237 60%, #22304a 100%)',
        boxShadow: '4px 0 24px 0 rgba(0,0,0,0.10)',
        borderRight: 'none',
      }}
    >
      {/* Línea de separación moderna: gradiente azul-cyan en dark, blanca en light */}
      <div
        className="absolute top-0 right-0 h-full w-1 z-50"
        style={{
          background: 'linear-gradient(to bottom, #3b82f6 0%, #06b6d4 100%)',
          opacity: 0.25,
          borderRadius: '0 8px 8px 0',
          boxShadow: '0 0 0 0 transparent',
        }}
      />
      {/* Línea blanca sutil en light mode (usando Tailwind para light) */}
      <div className="absolute top-0 right-0 h-full w-px z-50 bg-white/60 dark:hidden" />
      <div className="flex flex-col gap-8 items-center relative z-10">
        <img
          src={negocio.logo_url ? negocio.logo_url : '/logo.png'}
          alt="Logo"
          className="w-24 h-24 mb-2 drop-shadow-xl rounded-2xl border bg-white dark:bg-gray-800"
          draggable={false}
        />
        <div className="grid grid-cols-2 gap-4 w-full">
          {navItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center aspect-square rounded-3xl shadow-sm transition-all duration-200 w-full text-center px-2 py-4 cursor-pointer border-2
                ${location.pathname === item.to ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 scale-105' : 'border-transparent bg-white/0 dark:bg-gray-900/0 text-gray-300 dark:text-gray-200 hover:border-blue-300 hover:bg-blue-50/30 dark:hover:bg-blue-900/30'}`}
            >
              <span className={`text-3xl mb-2 ${item.color}`}>{item.icon}</span>
              <span className="font-semibold text-base mb-0.5">{item.label}</span>
              <span className={`text-xs ${item.color}`}>{item.desc}</span>
            </Link>
          ))}
          <button
            type="button"
            onClick={onValidarClienteClick}
            className="flex flex-col items-center justify-center aspect-square rounded-3xl shadow-sm transition-all duration-200 w-full text-center px-2 py-4 cursor-pointer border-2 border-transparent bg-white/0 dark:bg-gray-900/0 text-blue-400 hover:border-blue-300 hover:bg-blue-50/30 dark:hover:bg-blue-900/30"
          >
            <span className="text-3xl mb-2 text-blue-400"><FiMail /></span>
            <span className="font-semibold text-base mb-0.5">Validar Cliente</span>
            <span className="text-xs text-blue-400">Enviar email a validaciones</span>
          </button>
        </div>
      </div>
    </aside>
  );
} 