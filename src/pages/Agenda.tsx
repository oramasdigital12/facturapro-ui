import { useEffect, useState } from 'react';
import api from '../services/api';
import TareaModal from '../components/TareaModal';
import TareaItem from '../components/TareaItem';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { MoonIcon, SunIcon } from '@heroicons/react/24/solid';
import { FiSearch } from 'react-icons/fi';
import { useAuth, useDarkMode } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import BotonCrear from '../components/BotonCrear';

interface Cliente { id: string; nombre: string; categoria: string; }
interface Tarea { id: string; descripcion: string; fecha_hora: string; cliente_id: string; estado: string; para_venta: boolean; }

export default function Agenda() {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [contadores, setContadores] = useState({ pendiente: 0, por_vencer: 0, vencida: 0, completada: 0 });
  const [filtro, setFiltro] = useState<string>('pendiente');
  const [busqueda, setBusqueda] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [tareaEditando, setTareaEditando] = useState<Tarea | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { dark, setDark } = useDarkMode();

  useEffect(() => {
    fetchTareas();
    fetchContadores();
    fetchClientes();
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    // eslint-disable-next-line
  }, [filtro, dark]);

  useEffect(() => {
    fetchTareas();
    // eslint-disable-next-line
  }, [busqueda]);

  const fetchTareas = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/tareas?estado=${filtro}&q=${encodeURIComponent(busqueda)}`);
      setTareas(res.data);
    } catch {
      setTareas([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchContadores = async () => {
    try {
      const res = await api.get('/api/tareas/contador');
      setContadores(res.data);
    } catch {
      setContadores({ pendiente: 0, por_vencer: 0, vencida: 0, completada: 0 });
    }
  };

  const fetchClientes = async () => {
    try {
      const res = await api.get('/api/clientes');
      setClientes(res.data);
    } catch (error) {
      setClientes([]);
    }
  };

  const handleCreated = () => {
    fetchTareas();
    fetchContadores();
  };

  const tareasFiltradas = tareas
    .filter(tarea => {
      if (!busqueda.trim()) return true;
      const cliente = clientes.find(c => c.id === tarea.cliente_id);
      if (!cliente) return false;
      const primerNombre = cliente.nombre.trim().split(' ')[0].toLowerCase();
      return primerNombre.startsWith(busqueda.trim().toLowerCase());
    })
    .sort((a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime());

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

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

      {/* Logout y Dark mode button */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-50">
        <button
          type="button"
          onClick={() => setDark(!dark)}
          className="p-2 rounded-xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer"
          title={dark ? 'Modo claro' : 'Modo oscuro'}
        >
          {dark ? (
            <SunIcon className="w-6 h-6 text-yellow-400 group-hover:text-yellow-500" />
          ) : (
            <MoonIcon className="w-6 h-6 text-gray-400 group-hover:text-blue-500" />
          )}
        </button>
        <button
          type="button"
          onClick={() => handleLogout()}
          className="p-2 rounded-xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer"
          title="Cerrar sesión"
        >
          <ArrowRightOnRectangleIcon className="w-6 h-6 text-gray-400 dark:text-gray-200 group-hover:text-blue-500" />
        </button>
      </div>

      <div className="relative flex-1 flex flex-col px-4 pb-24">
        <div className="text-center mb-8 mt-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Agenda</h1>
          <div className="w-24 h-1 bg-blue-500 mx-auto rounded-full"></div>
        </div>
        <div className="flex flex-col gap-4 mb-6">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre de cliente..."
              className="w-full pl-10 pr-3 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </div>
          <div className="flex gap-2 justify-center mb-6 flex-wrap">
            <button
              className={`flex flex-col items-center px-3 py-2 rounded-xl border-2 transition-all duration-200 min-w-[70px] max-w-[90px] focus:outline-none ${filtro === 'pendiente' ? 'border-yellow-600 bg-yellow-50 text-yellow-700' : 'border-gray-200 bg-white text-gray-700 hover:border-yellow-400 hover:text-yellow-600'}`}
              onClick={() => setFiltro('pendiente')}
            >
              <span className="mb-1 text-xs font-bold rounded-full px-2 py-0.5 bg-yellow-400 text-white">{contadores['pendiente']}</span>
              <span className="text-xs font-medium">Pendientes</span>
            </button>
            <button
              className={`flex flex-col items-center px-3 py-2 rounded-xl border-2 transition-all duration-200 min-w-[70px] max-w-[90px] focus:outline-none ${filtro === 'por_vencer' ? 'border-orange-600 bg-orange-50 text-orange-700' : 'border-gray-200 bg-white text-gray-700 hover:border-orange-400 hover:text-orange-600'}`}
              onClick={() => setFiltro('por_vencer')}
            >
              <span className="mb-1 text-xs font-bold rounded-full px-2 py-0.5 bg-orange-500 text-white">{contadores['por_vencer']}</span>
              <span className="text-xs font-medium">Por vencer</span>
            </button>
            <button
              className={`flex flex-col items-center px-3 py-2 rounded-xl border-2 transition-all duration-200 min-w-[70px] max-w-[90px] focus:outline-none ${filtro === 'vencida' ? 'border-red-600 bg-red-50 text-red-700' : 'border-gray-200 bg-white text-gray-700 hover:border-red-400 hover:text-red-600'}`}
              onClick={() => setFiltro('vencida')}
            >
              <span className="mb-1 text-xs font-bold rounded-full px-2 py-0.5 bg-red-500 text-white">{contadores['vencida']}</span>
              <span className="text-xs font-medium">Vencidas</span>
            </button>
            <button
              className={`flex flex-col items-center px-3 py-2 rounded-xl border-2 transition-all duration-200 min-w-[70px] max-w-[90px] focus:outline-none ${filtro === 'completada' ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 bg-white text-gray-700 hover:border-green-400 hover:text-green-600'}`}
              onClick={() => setFiltro('completada')}
            >
              <span className="mb-1 text-xs font-bold rounded-full px-2 py-0.5 bg-green-500 text-white">{contadores['completada']}</span>
              <span className="text-xs font-medium">Completadas</span>
            </button>
          </div>
        </div>
        {/* Botón crear tarea arriba de la lista */}
        <div className="flex justify-start mb-4">
          <BotonCrear
            onClick={() => { setTareaEditando(null); setShowModal(true); }}
            label="Nueva Tarea"
          />
        </div>
        {loading ? (
          <div className="text-center py-8">Cargando...</div>
        ) : tareasFiltradas.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No hay tareas.</div>
        ) : (
          <ul className="space-y-2">
            {tareasFiltradas.map(tarea => (
              <TareaItem key={tarea.id} tarea={tarea} onEdit={(t: Tarea) => { setTareaEditando(t); setShowModal(true); }} onChange={handleCreated} clientes={clientes} />
            ))}
          </ul>
        )}
        <TareaModal open={showModal} onClose={() => setShowModal(false)} onCreated={handleCreated} tarea={tareaEditando} clientes={clientes} />
      </div>
    </div>
  );
} 