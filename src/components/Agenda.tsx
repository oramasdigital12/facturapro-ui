import { useState, useEffect } from 'react';
import TareaItem from './TareaItem';
import api from '../services/api';

interface Tarea {
  id: string;
  descripcion: string;
  fecha_hora: string;
  cliente_id: string;
  estado: string;
}

interface Cliente {
  id: string;
  nombre: string;
  categoria: string;
}

interface Contadores {
  pendiente: number;
  por_vencer: number;
  vencida: number;
  completada: number;
}

export default function Agenda() {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filtro, setFiltro] = useState<string>('pendiente');
  const [searchTerm, setSearchTerm] = useState('');
  const [contadores, setContadores] = useState<Contadores>({
    pendiente: 0,
    por_vencer: 0,
    vencida: 0,
    completada: 0
  });

  useEffect(() => {
    cargarTareas();
    cargarClientes();
  }, []);

  const cargarTareas = async () => {
    try {
      const response = await api.get('/api/tareas');
      setTareas(response.data);
      actualizarContadores(response.data);
    } catch (error) {
      console.error('Error al cargar tareas:', error);
    }
  };

  const cargarClientes = async () => {
    try {
      const response = await api.get('/api/clientes');
      setClientes(response.data);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    }
  };

  const actualizarContadores = (tareas: Tarea[]) => {
    const conteos = tareas.reduce((acc, tarea) => {
      acc[tarea.estado as keyof Contadores]++;
      return acc;
    }, {
      pendiente: 0,
      por_vencer: 0,
      vencida: 0,
      completada: 0
    });
    setContadores(conteos);
  };

  const handleEditTarea = (tarea: Tarea) => {
    // Implementar lógica de edición
    console.log('Editando tarea:', tarea);
  };

  const tareasFiltradas = tareas
    .filter(tarea => {
      const cliente = clientes.find(c => c.id === tarea.cliente_id);
      return cliente?.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .filter(tarea => filtro === 'todas' || tarea.estado === filtro);

  return (
    <div className="p-4">
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por nombre de cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="flex space-x-4 mb-4 overflow-x-auto">
        <button
          onClick={() => setFiltro('pendiente')}
          className={`flex items-center px-4 py-2 rounded-full ${
            filtro === 'pendiente' ? 'bg-blue-600 text-white' : 'bg-gray-100'
          }`}
        >
          Pendientes
          {contadores.pendiente > 0 && (
            <span className="ml-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
              {contadores.pendiente}
            </span>
          )}
        </button>
        
        <button
          onClick={() => setFiltro('por_vencer')}
          className={`flex items-center px-4 py-2 rounded-full ${
            filtro === 'por_vencer' ? 'bg-blue-600 text-white' : 'bg-gray-100'
          }`}
        >
          Por vencer
          {contadores.por_vencer > 0 && (
            <span className="ml-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
              {contadores.por_vencer}
            </span>
          )}
        </button>

        <button
          onClick={() => setFiltro('vencida')}
          className={`flex items-center px-4 py-2 rounded-full ${
            filtro === 'vencida' ? 'bg-blue-600 text-white' : 'bg-gray-100'
          }`}
        >
          Vencidas
          {contadores.vencida > 0 && (
            <span className="ml-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
              {contadores.vencida}
            </span>
          )}
        </button>

        <button
          onClick={() => setFiltro('completada')}
          className={`flex items-center px-4 py-2 rounded-full ${
            filtro === 'completada' ? 'bg-blue-600 text-white' : 'bg-gray-100'
          }`}
        >
          Completadas
          {contadores.completada > 0 && (
            <span className="ml-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
              {contadores.completada}
            </span>
          )}
        </button>
      </div>

      <div className="space-y-4">
        {tareasFiltradas.map((tarea) => (
          <TareaItem
            key={tarea.id}
            tarea={tarea}
            onEdit={handleEditTarea}
            onChange={cargarTareas}
            clientes={clientes}
          />
        ))}
      </div>
    </div>
  );
} 