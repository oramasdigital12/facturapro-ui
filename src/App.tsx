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
import FacturaPDFPublica from './pages/FacturaPDFPublica';
import Facturas from './pages/Facturas';
import FacturaForm from './pages/FacturaForm';
import FacturaDetalle from './pages/FacturaDetalle';

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
              {/* Ruta pública para facturas - no requiere autenticación */}
              <Route path="/factura/:cliente/:numero" element={<FacturaPDFPublica />} />
              <Route path="/factura/:id" element={<FacturaPDFPublica />} />
              <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
                <Route path="/home" element={<Home />} />
                <Route path="/clientes" element={<Clientes />} />
                <Route path="/configuracion" element={<Configuracion />} />
                <Route path="/facturas" element={<Facturas />} />
                <Route path="/facturas/nueva" element={<FacturaForm />} />
                <Route path="/facturas/:id" element={<FacturaForm />} />
                <Route path="/factura-detalle/:id" element={<FacturaDetalle />} />
              </Route>
              <Route path="*" element={<Navigate to="/home" />} />
            </Routes>
          </div>
        </DarkModeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App; 