import { Link } from 'react-router-dom';
import { UserGroupIcon, CurrencyDollarIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { useClientes } from '../contexts/ClientesContext';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const { clientes } = useClientes();
  const { user } = useAuth();

  const clientesActivos = clientes.filter(c => c.categoria === 'activo').length;
  const clientesPorVencer = clientes.filter(c => c.categoria === 'por_vencer').length;
  const clientesPendientes = clientes.filter(c => c.categoria === 'pendiente').length;

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Saludo */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          ¡Hola, {user?.nombre}!
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Bienvenido a tu panel de control
        </p>
      </div>

      {/* Accesos rápidos */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Link
          to="/clientes"
          className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
            <UserGroupIcon className="h-6 w-6 text-blue-600" />
          </div>
          <span className="text-sm font-medium text-gray-900">Clientes</span>
        </Link>

        <Link
          to="/ventas"
          className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
            <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
          </div>
          <span className="text-sm font-medium text-gray-900">Ventas</span>
        </Link>
      </div>

      {/* Estado de clientes */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Estado de Clientes
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-semibold text-green-600">
              {clientesActivos}
            </div>
            <div className="text-sm text-gray-500">Activos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-yellow-600">
              {clientesPorVencer}
            </div>
            <div className="text-sm text-gray-500">Por vencer</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-red-600">
              {clientesPendientes}
            </div>
            <div className="text-sm text-gray-500">Pendientes</div>
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Acciones Rápidas
        </h2>
        <div className="space-y-4">
          <Link
            to="/clientes/nuevo"
            className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100"
          >
            <span className="text-sm font-medium text-gray-900">
              Añadir nuevo cliente
            </span>
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <Link
            to="/ventas/nueva"
            className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100"
          >
            <span className="text-sm font-medium text-gray-900">
              Registrar nueva venta
            </span>
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <Link
            to="/configuracion"
            className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100"
          >
            <span className="text-sm font-medium text-gray-900">
              Configurar mi negocio
            </span>
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
} 