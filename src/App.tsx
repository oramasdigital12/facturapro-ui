import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, DarkModeProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import PrivateRoute from './routes/PrivateRoute';
import Clientes from './pages/Clientes';
import Layout from './components/Layout';
import Home from './pages/Home';
import Configuracion from './pages/Configuracion';
import Agenda from './pages/Agenda';
import Ventas from './pages/Ventas';

function App() {
  return (
    <Router>
      <AuthProvider>
        <DarkModeProvider>
          <div className="min-h-screen bg-gray-100">
            <Toaster position="top-right" />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/home"
                element={
                  <PrivateRoute>
                    <Layout>
                      <Home />
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
                path="/configuracion"
                element={
                  <PrivateRoute>
                    <Layout>
                      <Configuracion />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/agenda"
                element={
                  <PrivateRoute>
                    <Layout>
                      <Agenda />
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
              <Route path="*" element={<Navigate to="/home" />} />
            </Routes>
          </div>
        </DarkModeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App; 