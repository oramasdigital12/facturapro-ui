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
              <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
                <Route path="/home" element={<Home />} />
                <Route path="/clientes" element={<Clientes />} />
                <Route path="/configuracion" element={<Configuracion />} />
                <Route path="/agenda" element={<Agenda />} />
                <Route path="/ventas" element={<Ventas />} />
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