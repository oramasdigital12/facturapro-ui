import { useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Onboarding() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    businessName: '',
    businessType: '',
    phone: '',
    email: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/negocio', form); // Ajusta el endpoint si es necesario
      toast.success('¡Datos del negocio guardados!');
      navigate('/home');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al guardar los datos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-4 text-center">Configura tu negocio</h2>
        <input
          name="businessName"
          type="text"
          placeholder="Nombre del negocio"
          className="w-full mb-3 px-3 py-2 border rounded focus:outline-none"
          value={form.businessName}
          onChange={handleChange}
          required
        />
        <select
          name="businessType"
          className="w-full mb-3 px-3 py-2 border rounded focus:outline-none"
          value={form.businessType}
          onChange={handleChange}
          required
        >
          <option value="">Tipo de negocio</option>
          <option value="Tienda">Tienda</option>
          <option value="Servicios">Servicios</option>
          <option value="Distribuidor">Distribuidor</option>
          <option value="Otro">Otro</option>
        </select>
        <input
          name="phone"
          type="tel"
          placeholder="Teléfono"
          className="w-full mb-3 px-3 py-2 border rounded focus:outline-none"
          value={form.phone}
          onChange={handleChange}
          required
        />
        <input
          name="email"
          type="email"
          placeholder="Email del negocio"
          className="w-full mb-3 px-3 py-2 border rounded focus:outline-none"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          name="address"
          type="text"
          placeholder="Dirección"
          className="w-full mb-3 px-3 py-2 border rounded focus:outline-none"
          value={form.address}
          onChange={handleChange}
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition"
          disabled={loading}
        >
          {loading ? 'Guardando...' : 'Guardar y continuar'}
        </button>
      </form>
    </div>
  );
} 