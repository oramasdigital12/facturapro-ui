type FacturaItemsTableProps = {
  items: any[];
  onEdit: (index: number, field: string, value: any) => void;
  onDelete: (index: number) => void;
};

export default function FacturaItemsTable({ items, onEdit, onDelete }: FacturaItemsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-2 py-1 text-left">Categoría</th>
            <th className="px-2 py-1 text-left">Descripción</th>
            <th className="px-2 py-1 text-right">Precio Unitario</th>
            <th className="px-2 py-1 text-right">Cantidad</th>
            <th className="px-2 py-1 text-right">Total</th>
            <th className="px-2 py-1"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx}>
              <td className="px-2 py-1">{item.categoria}</td>
              <td className="px-2 py-1">
                <input type="text" className="w-full bg-transparent" value={item.descripcion} onChange={e => onEdit(idx, 'descripcion', e.target.value)} />
              </td>
              <td className="px-2 py-1 text-right">
                <input type="number" className="w-16 bg-transparent text-right" value={item.precio_unitario} onChange={e => onEdit(idx, 'precio_unitario', Number(e.target.value))} />
              </td>
              <td className="px-2 py-1 text-right">
                <input type="number" className="w-12 bg-transparent text-right" value={item.cantidad} onChange={e => onEdit(idx, 'cantidad', Number(e.target.value))} />
              </td>
              <td className="px-2 py-1 text-right">${item.total?.toFixed(2)}</td>
              <td className="px-2 py-1 text-right">
                <button className="text-red-500 hover:underline text-xs" onClick={() => onDelete(idx)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 