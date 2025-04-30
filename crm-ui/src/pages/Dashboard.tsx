import { useState, useEffect } from 'react';
import api from '../lib/axios';
import { Cliente, Venta } from '../types';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalClientes: 0,
    clientesActivos: 0,
    ventasMes: 0,
    mensajesEnviados: 0
  });

  const [clientesRecientes, setClientesRecientes] = useState<Cliente[]>([]);
  const [ventasRecientes, setVentasRecientes] = useState<Venta[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [clientesRes, ventasRes] = await Promise.all([
          api.get('/clientes'),
          api.get('/ventas')
        ]);

        const clientes = clientesRes.data;
        const ventas = ventasRes.data;

        setStats({
          totalClientes: clientes.length,
          clientesActivos: clientes.filter((c: Cliente) => c.categoria === 'activo').length,
          ventasMes: ventas.filter((v: Venta) => {
            const fecha = new Date(v.fecha_pago);
            const hoy = new Date();
            return fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear();
          }).reduce((acc: number, v: Venta) => acc + v.monto, 0),
          mensajesEnviados: 0 // Implementar cuando tengamos el endpoint
        });

        setClientesRecientes(clientes.slice(0, 5));
        setVentasRecientes(ventas.slice(0, 5));
      } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Total Clientes</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{stats.totalClientes}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Clientes Activos</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{stats.clientesActivos}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Ventas del Mes</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            ${stats.ventasMes.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Mensajes Enviados</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{stats.mensajesEnviados}</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Clientes Recientes</h3>
          <div className="space-y-3">
            {clientesRecientes.map((cliente) => (
              <div key={cliente.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{cliente.nombre}</p>
                  <p className="text-sm text-gray-500">{cliente.telefono}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  cliente.categoria === 'activo' ? 'bg-green-100 text-green-800' :
                  cliente.categoria === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {cliente.categoria}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Ventas Recientes</h3>
          <div className="space-y-3">
            {ventasRecientes.map((venta) => (
              <div key={venta.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    ${venta.monto.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(venta.fecha_pago).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  venta.estado === 'pagada' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {venta.estado}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 