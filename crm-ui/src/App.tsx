import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Ventas from './pages/Ventas';
import Configuracion from './pages/Configuracion';
import Layout from './components/Layout';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-100">
          <Toaster position="top-right" />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/clientes"
              element={
                <PrivateRoute>
                  <Layout>
                    <Clientes />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/ventas"
              element={
                <PrivateRoute>
                  <Layout>
                    <Ventas />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/configuracion"
              element={
                <PrivateRoute>
                  <Layout>
                    <Configuracion />
                  </Layout>
                </PrivateRoute>
              }
            />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
