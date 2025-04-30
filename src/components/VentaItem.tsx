import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { Venta, Cliente } from '../types';

interface VentaItemProps {
  venta: Venta;
  clientes: Cliente[];
  onEdit: (venta: Venta) => void;
  onChange: () => void;
}

export default function VentaItem({ venta, clientes, onEdit, onChange }: VentaItemProps) {
  const cliente = clientes.find((c) => c.id === venta.cliente_id);
  return (
    <li className="bg-white rounded shadow p-4 flex flex-col gap-1 border-l-4 border-blue-500">
      <div className="flex justify-between items-center gap-2">
        <span className="font-semibold text-base break-words max-w-[60%]">{cliente?.nombre || 'Cliente'}</span>
        <div className="flex gap-1">
          <button onClick={() => onEdit(venta)} className="text-blue-500 hover:bg-blue-50 rounded-full p-1" title="Editar"><FiEdit2 /></button>
          <button onClick={() => onChange()} className="text-red-600 hover:bg-red-50 rounded-full p-1" title="Eliminar"><FiTrash2 /></button>
        </div>
      </div>
      <span className="text-xs text-gray-500">{new Date(venta.fecha).toLocaleDateString()}</span>
      <span className="text-xs text-gray-700">Monto: <span className="font-semibold">${venta.monto}</span></span>
      <span className={`inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-semibold select-none mt-1 ${venta.tipo === 'mensual' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{venta.tipo === 'mensual' ? 'Mensualidad' : 'Venta única'}</span>
    </li>
  );
} 