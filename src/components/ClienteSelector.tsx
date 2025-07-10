export default function ClienteSelector() {
  return (
    <div className="mb-2">
      <input type="text" placeholder="Buscar cliente..." className="w-full px-3 py-2 rounded-xl border shadow-sm mb-1" />
      <div className="bg-white rounded-xl shadow p-2 max-h-40 overflow-y-auto">
        {/* Lista de clientes filtrados */}
        <div className="px-2 py-1 hover:bg-blue-50 rounded cursor-pointer">Juan Pérez</div>
        <div className="px-2 py-1 hover:bg-blue-50 rounded cursor-pointer">María López</div>
        {/* ...más clientes */}
      </div>
    </div>
  );
} 