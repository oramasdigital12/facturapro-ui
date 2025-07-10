export default function ServicioSelector() {
  return (
    <div className="mb-2">
      <select className="w-full px-3 py-2 rounded-xl border shadow-sm mb-1">
        <option value="">Selecciona un servicio</option>
        <option value="1">Diseño de logo</option>
        <option value="2">Desarrollo web</option>
        {/* ...más servicios */}
      </select>
    </div>
  );
} 