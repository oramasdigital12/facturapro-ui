import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { HiOutlineHome, HiOutlineUserGroup, HiOutlineClipboardList, HiOutlineCurrencyDollar, HiOutlineCog, HiOutlineMail } from "react-icons/hi";
import { DocumentTextIcon } from '@heroicons/react/24/outline';

interface SidebarNavProps {
  logo_url?: string;
  nombre_negocio?: string;
  className?: string;
  color_personalizado?: string;
}

const navItems = [
  {
    label: "Inicio",
    to: "/",
    icon: <HiOutlineHome size={22} />,
  },
  {
    label: "Clientes",
    to: "/clientes",
    icon: <HiOutlineUserGroup size={22} />,
  },
  {
    label: "Tareas",
    to: "/agenda",
    icon: <HiOutlineClipboardList size={22} />,
  },
  {
    label: "Facturas",
    to: "/facturas",
    icon: <DocumentTextIcon className='w-6 h-6' />,
  },
  {
    label: "Ventas",
    to: "/ventas",
    icon: <HiOutlineCurrencyDollar size={22} />,
  },
  {
    label: "Información del Negocio",
    to: "/configuracion",
    icon: <HiOutlineCog size={22} />,
  },
  {
    label: "Validar Cliente",
    to: "/validar-cliente",
    icon: <HiOutlineMail size={22} />,
  },
];

const SidebarNav: React.FC<SidebarNavProps> = ({ logo_url, nombre_negocio, className, color_personalizado = '#2563eb' }) => {
  const location = useLocation();
  // Utilidad para color transparente
  const transparent = color_personalizado + '22'; // #RRGGBBAA (AA=22 ~ 13% opacity)
  return (
    <aside
      className={`h-screen w-64 bg-slate-50 dark:bg-slate-800 shadow-lg flex flex-col items-center py-8 px-4 transition-colors duration-300 hidden md:flex ${className || ''}`}
    >
      {/* Logo y nombre dinámicos */}
      <div className="mb-10 flex flex-col items-center">
        <img
          src={logo_url && logo_url.trim() !== '' ? logo_url : "/crm-icon.svg"}
          alt="Logo"
          className="w-16 h-16 rounded-xl bg-white dark:bg-slate-700 p-2 shadow-md mb-2 object-contain"
        />
        <span className="text-lg font-bold text-slate-700 dark:text-slate-200 tracking-tight text-center w-full truncate max-w-[12rem]">
          {nombre_negocio && nombre_negocio.trim() !== '' ? nombre_negocio : 'VendedorPro'}
        </span>
      </div>
      {/* Navegación */}
      <nav className="flex flex-col gap-2 w-full">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive: navActive }) =>
                [
                  "flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 relative",
                  `hover:bg-[${transparent}] hover:text-[${color_personalizado}]`,
                  (isActive || navActive)
                    ? `bg-[${transparent}] text-[${color_personalizado}] shadow-sm`
                    : "text-slate-700 dark:text-slate-200 bg-transparent"
                ].join(" ")
              }
              style={isActive ? { borderLeft: `4px solid ${color_personalizado}` } : {}}
              end={item.to === "/"}
            >
              {React.cloneElement(item.icon, { color: isActive ? color_personalizado : undefined })}
              <span className="truncate">{item.label}</span>
              {isActive && (
                <span className="absolute left-0 bottom-0 w-full h-1 rounded-full" style={{ background: color_personalizado, opacity: 0.18 }} />
              )}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default SidebarNav; 