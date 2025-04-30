import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex justify-center items-center h-screen">Cargando...</div>;
  return user ? <>{children}</> : <Navigate to="/login" />;
} 