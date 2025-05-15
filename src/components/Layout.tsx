import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import { ReactNode, useEffect, useState } from 'react';
import SidebarNav from './SidebarNav';
import ValidarClienteModal from '../components/ValidarClienteModal';
import api from '../services/api';

interface LayoutProps {
  children?: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [showValidarModal, setShowValidarModal] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [negocio, setNegocio] = useState({ nombre_negocio: '', email: '' });

  useEffect(() => {
    api.get('/api/clientes').then(res => setClientes(res.data));
    api.get('/api/negocio-config').then(res => setNegocio(res.data));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 md:flex md:flex-row">
      <SidebarNav className="hidden md:flex" onValidarClienteClick={() => setShowValidarModal(true)} />
      <main className="pb-16 flex flex-col items-center justify-center min-h-screen max-w-2xl mx-auto px-4 md:px-8 flex-1 w-full overflow-y-auto">
        {children || <Outlet />}
      </main>
      <div className="md:hidden">
        <BottomNav />
      </div>
      <ValidarClienteModal open={showValidarModal} onClose={() => setShowValidarModal(false)} clientes={clientes} nombreNegocio={negocio.nombre_negocio} emailNegocio={negocio.email} onEditCliente={() => {}} />
    </div>
  );
} 