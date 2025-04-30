import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/home');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  // Mostrar mensaje de éxito si viene del registro
  const registered = location.state && location.state.registered;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-400 to-blue-600 relative overflow-hidden">
      {/* Onda decorativa inferior */}
      <svg className="absolute bottom-0 left-0 w-full h-40" viewBox="0 0 1440 320" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill="#23253A" fillOpacity="1" d="M0,224L48,202.7C96,181,192,139,288,144C384,149,480,203,576,218.7C672,235,768,213,864,197.3C960,181,1056,171,1152,186.7C1248,203,1344,245,1392,266.7L1440,288L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
      </svg>
      <form onSubmit={handleSubmit} className="relative z-10 bg-[#23253A] bg-opacity-95 p-8 rounded-2xl w-full max-w-xs flex flex-col items-center shadow-xl">
        {/* Logo o icono */}
        <div className="mb-6 mt-2">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center mx-auto">
            <span className="text-white text-3xl font-extrabold">CRM</span>
          </div>
        </div>
        <h2 className="text-2xl font-extrabold mb-6 text-center text-white">Iniciar sesión</h2>
        {registered && (
          <div className="text-green-400 text-sm mb-2 text-center font-semibold">
            Usuario registrado correctamente. Ahora puedes iniciar sesión.
          </div>
        )}
        {error && <div className="text-red-400 text-sm mb-2">{error}</div>}
        <input
          type="email"
          placeholder="Correo electrónico"
          className="w-full mb-4 px-4 py-3 bg-[#23253A] border border-blue-400/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 text-white placeholder:text-blue-200 transition"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          className="w-full mb-4 px-4 py-3 bg-[#23253A] border border-blue-400/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 text-white placeholder:text-blue-200 transition"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-cyan-400 to-blue-500 text-white py-3 rounded-lg font-bold text-lg mt-2 hover:from-cyan-500 hover:to-blue-600 transition"
          disabled={loading}
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
        <div className="mt-6 text-center text-sm text-blue-200">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="text-cyan-300 hover:underline font-semibold">Regístrate</Link>
        </div>
      </form>
    </div>
  );
} 