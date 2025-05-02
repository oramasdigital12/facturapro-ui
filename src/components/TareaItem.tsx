import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DateTime } from 'luxon';
import { PencilIcon, TrashIcon, CheckCircleIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import toast from 'react-hot-toast';
import { showDeleteConfirmation, showSuccessMessage, showTaskConfirmation } from '../utils/alerts';
import { useNavigate } from 'react-router-dom';

interface Props {
  tarea: {
    id: string;
    descripcion: string;
    fecha_hora: string;
    cliente_id: string;
    estado: string;
    para_venta: boolean;
  };
  onEdit: (tarea: any) => void;
  onChange: () => void;
  clientes: Array<{ id: string; nombre: string; categoria: string; }>;
}

export default function TareaItem({ tarea, onEdit, onChange, clientes }: Props) {
  const navigate = useNavigate();

  const handleDelete = async () => {
    const result = await showDeleteConfirmation('¿Seguro que deseas eliminar esta tarea?');
    if (result.isConfirmed) {
      try {
        await api.delete(`/api/tareas/${tarea.id}`);
        showSuccessMessage('Tarea eliminada con éxito');
        onChange();
      } catch (error) {
        console.error('Error al eliminar la tarea:', error);
        toast.error('Error al eliminar la tarea');
      }
    }
  };

  const handleComplete = async () => {
    try {
      const result = await showTaskConfirmation();
      if (result.isConfirmed) {
        try {
          const response = await api.patch(`/api/tareas/${tarea.id}/estado`, {
            estado: 'completada'
          });
          
          if (response.data) {
            if (tarea.para_venta) {
              const cliente = clientes.find(c => c.id === tarea.cliente_id);
              await showSuccessMessage(`¡Tarea completada! Ahora podrás registrar la venta para ${cliente?.nombre || 'el cliente'}`);
              localStorage.setItem('venta_cliente_id', tarea.cliente_id);
              navigate('/ventas');
            } else {
              showSuccessMessage('Tarea completada con éxito');
            }
            onChange();
          } else {
            toast.error('No se pudo completar la tarea');
          }
        } catch (error: any) {
          console.error('Error al completar la tarea:', error);
          toast.error(error.response?.data?.message || 'Error al completar la tarea');
        }
      }
    } catch (error) {
      console.error('Error en el diálogo de confirmación:', error);
      toast.error('Error al mostrar el diálogo de confirmación');
    }
  };

  const handleUndoComplete = async () => {
    try {
      const result = await showDeleteConfirmation('¿Deseas volver la tarea a pendiente?');
      if (result.isConfirmed) {
        const response = await api.patch(`/api/tareas/${tarea.id}/estado`, {
          estado: 'pendiente'
        });
        if (response.data) {
          showSuccessMessage('Tarea marcada como pendiente');
          onChange();
        } else {
          toast.error('No se pudo deshacer la tarea');
        }
      }
    } catch (error: any) {
      console.error('Error al deshacer la tarea:', error);
      toast.error(error.response?.data?.message || 'Error al deshacer la tarea');
    }
  };

  const cliente = clientes.find(c => c.id === tarea.cliente_id);

  // Colores para el estatus del cliente
  const categoriaColor =
    cliente?.categoria === 'activo' ? 'bg-green-100 text-green-800' :
    cliente?.categoria === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
    cliente?.categoria === 'por_vencer' ? 'bg-orange-100 text-orange-800' :
    cliente?.categoria === 'Vencido' ? 'bg-red-100 text-red-800' :
    'bg-gray-100 text-gray-800';

  return (
    <div className="bg-white rounded shadow p-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-medium">{tarea.descripcion}</p>
          <p className="text-sm text-gray-500">
            {(() => {
              // Convertir de UTC a hora local de Puerto Rico usando Luxon
              const fechaPR = DateTime.fromISO(tarea.fecha_hora, { zone: 'utc' }).setZone('America/Puerto_Rico');
              return fechaPR.setLocale('es').toFormat("d 'de' LLLL, yyyy h:mm a");
            })()}
          </p>
          <p className="text-sm text-gray-500">Cliente: {cliente?.nombre || 'No encontrado'}</p>
          {tarea.para_venta && (
            <span className="inline-block text-xs px-2 py-1 rounded bg-blue-100 text-blue-800 font-semibold mt-1">Para venta</span>
          )}
          {cliente && (
            <span className={`inline-block text-xs px-2 py-1 rounded mt-1 ${categoriaColor}`}>
              Estatus: {cliente.categoria}
            </span>
          )}
        </div>
        <div className="flex space-x-2">
          {tarea.estado !== 'completada' && (
            <button
              onClick={handleComplete}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
              title="Marcar como completada"
            >
              <CheckCircleIcon className="h-5 w-5" />
            </button>
          )}
          {tarea.estado === 'completada' && (
            <button
              onClick={handleUndoComplete}
              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-full"
              title="Deshacer completada"
            >
              <ArrowUturnLeftIcon className="h-5 w-5" />
            </button>
          )}
          <button
            onClick={() => onEdit(tarea)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 text-red-600 hover:bg-red-50 rounded-full"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
      <span className={`inline-block text-xs px-2 py-1 rounded mt-2 ${
        tarea.estado === 'completada' ? 'bg-green-100 text-green-800' :
        tarea.estado === 'pendiente' ? 'bg-blue-100 text-blue-800' :
        tarea.estado === 'vencida' ? 'bg-red-100 text-red-800' :
        'bg-yellow-100 text-yellow-800'
      }`}>
        {tarea.estado === 'completada' ? 'Tarea: Completada' : `Tarea: ${tarea.estado.charAt(0).toUpperCase() + tarea.estado.slice(1)}`}
      </span>
    </div>
  );
} 