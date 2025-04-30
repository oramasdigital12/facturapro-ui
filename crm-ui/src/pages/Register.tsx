import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombreNegocio, setNombreNegocio] = useState('');
  const [tipoNegocio, setTipoNegocio] = useState('');
  const [telefono, setTelefono] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await register(email, password, nombreNegocio);
      // Aquí deberíamos actualizar el perfil con los datos adicionales
      toast.success('¡Registro exitoso!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Error al registrar');
      console.error('Error de registro:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Crear nueva cuenta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            O{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              inicia sesión si ya tienes una cuenta
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Correo electrónico"
              />
            </div>
            <div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Contraseña"
              />
            </div>
            <div>
              <input
                type="text"
                required
                value={nombreNegocio}
                onChange={(e) => setNombreNegocio(e.target.value)}
                className="w-full px-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre del negocio"
              />
            </div>
            <div>
              <select
                required
                value={tipoNegocio}
                onChange={(e) => setTipoNegocio(e.target.value)}
                className="w-full px-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecciona el tipo de negocio</option>
                <option value="retail">Retail</option>
                <option value="servicios">Servicios</option>
                <option value="restaurante">Restaurante</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <input
                type="tel"
                required
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full px-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Teléfono"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Registrando...' : 'Registrarse'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 