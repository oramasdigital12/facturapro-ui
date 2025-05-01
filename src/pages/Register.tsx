import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({ fullName, email, password });
      navigate('/login', { state: { registered: true } });
    } catch (err: any) {
      if (err.response?.data) {
        setError(JSON.stringify(err.response.data));
        toast.error(JSON.stringify(err.response.data));
      } else {
        setError(err.message || 'Error al registrarse');
        toast.error(err.message || 'Error al registrarse');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-400 to-blue-600 relative overflow-hidden">
      {/* Onda decorativa inferior eliminada */}
      <form onSubmit={handleSubmit} className="relative z-10 bg-[#23253A] bg-opacity-95 p-8 rounded-2xl w-full max-w-xs flex flex-col items-center shadow-xl">
        {/* Logo solo animado, sin círculo de fondo */}
        <div className="mb-8 mt-2 flex justify-center">
          <img
            src="/logo.png"
            alt="CRM Logo"
            className="w-24 h-24 object-contain animate-float"
            draggable={false}
          />
        </div>
        <h2 className="text-2xl font-extrabold mb-6 text-center text-white">Crear cuenta</h2>
        {error && <div className="text-red-400 text-sm mb-2">{error}</div>}
        <input
          type="text"
          placeholder="Nombre completo"
          className="w-full mb-4 px-4 py-3 bg-[#23253A] border border-blue-400/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 text-white placeholder:text-blue-200 transition"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          required
        />
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
          {loading ? 'Creando...' : 'Crear cuenta'}
        </button>
        <div className="mt-6 text-center text-sm text-blue-200">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-cyan-300 hover:underline font-semibold">Inicia sesión</Link>
        </div>
      </form>
    </div>
  );
} 