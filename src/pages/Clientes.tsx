import { useEffect, useState } from 'react';
import api from '../services/api';
import { FiSearch, FiMail, FiMapPin, FiFileText } from 'react-icons/fi';
import { BsGenderAmbiguous } from 'react-icons/bs';
import ClienteModal from '../components/ClienteModal';
import { PhoneIcon } from '@heroicons/react/24/outline';
import { ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { PencilIcon } from '@heroicons/react/24/outline';
import { TrashIcon } from '@heroicons/react/24/outline';
import { UserIcon } from '@heroicons/react/24/outline';
import MensajeWhatsappModal from '../components/MensajeWhatsappModal';
import { showDeleteConfirmation, showSuccessMessage } from '../utils/alerts';
import { useDarkMode } from '../contexts/AuthContext';
import { useOutletContext } from 'react-router-dom';
import Swal from 'sweetalert2';
import EnviarEmailModal from '../components/EnviarEmailModal';
import BotonCrear from '../components/BotonCrear';

interface Cliente {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  categoria: string;
  sexo?: string;
  direccion?: string;
  notas?: string;
}

const categorias = [
  { label: 'Todos', value: '', color: 'blue', icon: '👥' },
  { label: 'Activos', value: 'activo', color: 'green', icon: '✅' },
  { label: 'Pendientes', value: 'pendiente', color: 'yellow', icon: '⏳' },
];

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showMensajeModal, setShowMensajeModal] = useState(false);
  const [clienteParaMensaje, setClienteParaMensaje] = useState<Cliente | null>(null);
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [clienteParaEmail, setClienteParaEmail] = useState<Cliente | null>(null);
  const [clientesPreseleccionados, setClientesPreseleccionados] = useState<string[] | undefined>(undefined);
  const { dark } = useDarkMode();
  const outletContext = useOutletContext() as { color_personalizado?: string } | null;
  const color_personalizado = outletContext?.color_personalizado || '#2563eb';

  useEffect(() => {
    fetchClientes();
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    // eslint-disable-next-line
  }, []);

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/clientes');
      setClientes(res.data);
    } catch {
      setClientes([]);
    } finally {
      setLoading(false);
    }
  };

  // Calcular contadores SIEMPRE sobre el arreglo completo de clientes
  const contadores = {
    '': clientes.length,
    'activo': clientes.filter(c => c.categoria === 'activo').length,
    'pendiente': clientes.filter(c => c.categoria === 'pendiente').length,
  };

  // Filtrado por categoría (solo para el listado)
  const clientesFiltrados = categoria
    ? clientes.filter(cliente => cliente.categoria === categoria)
    : clientes;

  // Filtrado por búsqueda (solo para el listado)
  const clientesMostrados = clientesFiltrados.filter(cliente => {
    const primerNombre = cliente.nombre.trim().split(' ')[0].toLowerCase();
    return primerNombre.startsWith(busqueda.trim().toLowerCase());
  });

  const handleDelete = async (id: string) => {
    const result = await showDeleteConfirmation('¿Seguro que deseas eliminar este cliente?');
    if (result.isConfirmed) {
      try {
        await api.delete(`/api/clientes/${id}`);
        showSuccessMessage('Cliente eliminado con éxito');
        setClientes(clientes.filter(cliente => cliente.id !== id));
      } catch (error) {
        console.error('Error al eliminar el cliente:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col md:items-center md:justify-center md:max-w-3xl md:mx-auto md:px-8 md:pl-28">
      {/* Wave decoration */}
      <div className="absolute inset-x-0 top-0 -z-10">
        <svg className="w-full h-48" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <defs>
            <linearGradient id="wave-gradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
          <path
            fill="url(#wave-gradient)"
            d="M0,96L48,112C96,128,192,160,288,186.7C384,213,480,235,576,218.7C672,203,768,149,864,128C960,107,1056,117,1152,128C1248,139,1344,149,1392,154.7L1440,160L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
          />
        </svg>
      </div>

      <div className="relative flex-1 flex flex-col px-3 sm:px-4 pb-24">
        <div className="text-center mb-6 mt-6 md:mb-8 md:mt-8">
          <h1 className="text-xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Clientes</h1>
          <div className="w-16 h-1 mx-auto rounded-full" style={{ background: color_personalizado }}></div>
        </div>

        <div className="flex flex-col gap-4 mb-6">
          {/* Búsqueda moderna */}
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre..."
              className="w-full pl-12 pr-4 py-4 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-white dark:bg-gray-800 shadow-lg text-gray-900 dark:text-gray-100"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </div>

          {/* Filtros modernos */}
          <div className="flex gap-3 justify-center mb-6">
            {categorias.map(cat => (
              <button
                key={cat.value}
                className={`flex flex-col items-center px-6 py-4 rounded-2xl border-2 transition-all duration-300 min-w-[100px] focus:outline-none transform hover:scale-105 ${
                  categoria === cat.value 
                    ? `border-${cat.color}-500 bg-${cat.color}-50 text-${cat.color}-700 shadow-lg` 
                    : `border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-${cat.color}-400 hover:text-${cat.color}-600 hover:shadow-md`
                }`}
                onClick={() => setCategoria(cat.value)}
              >
                <span className="text-2xl mb-2">{cat.icon}</span>
                <span className="text-sm font-semibold">{cat.label}</span>
                <span className={`text-lg font-bold mt-1 ${
                  cat.color === 'blue' ? 'text-blue-600' :
                  cat.color === 'green' ? 'text-green-600' :
                  'text-yellow-600'
                }`}>
                  {contadores[cat.value as keyof typeof contadores]}
                </span>
              </button>
            ))}
          </div>

          {/* Botón de email y crear cliente */}
          <div className="flex justify-between items-center mb-4 gap-2">
            <div className="flex gap-2 items-center w-full justify-end">
              <div className="hidden md:block">
                <BotonCrear
                  onClick={() => {
                    setClienteEditando(null);
                    setShowModal(true);
                  }}
                  label="Nuevo Cliente"
                  color_personalizado={color_personalizado}
                  size="md"
                  className=""
                />
              </div>
              <button
                onClick={() => setShowEmailModal(true)}
                className="p-4 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                title="Enviar email"
                style={{ boxShadow: '0 4px 12px rgba(59,130,246,0.15)' }}
              >
                <FiMail className="h-6 w-6" />
              </button>
            </div>
            {/* Botón flotante solo en móvil */}
            <div className="fixed top-1/2 -translate-y-1/2 right-6 z-50 md:hidden">
              <BotonCrear
                onClick={() => {
                  setClienteEditando(null);
                  setShowModal(true);
                }}
                label=""
                color_personalizado={color_personalizado}
                size="fab"
                className=""
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Cargando clientes...</p>
          </div>
        ) : clientesMostrados.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <UserIcon className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
              No hay clientes
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {busqueda ? 'No se encontraron clientes con ese nombre.' : 'Comienza agregando tu primer cliente.'}
            </p>
            {!busqueda && (
              <button
                onClick={() => {
                  setClienteEditando(null);
                  setShowModal(true);
                }}
                className="px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200"
                style={{ background: color_personalizado, color: 'white' }}
              >
                Agregar Primer Cliente
              </button>
            )}
          </div>
        ) : (
          <ul className="space-y-4">
            {clientesMostrados.map((cliente) => (
              <li key={cliente.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 relative hover:shadow-xl transition-all duration-300">
                {/* Header del cliente */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {cliente.nombre?.charAt(0)?.toUpperCase() || 'C'}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                        {cliente.nombre}
                      </h3>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        cliente.categoria === 'activo' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        cliente.categoria === 'pendiente' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}>
                        {cliente.categoria === 'activo' ? '✅ Activo' : '⏳ Pendiente'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setClienteEditando(cliente);
                        setShowModal(true);
                      }}
                      className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors"
                      title="Editar cliente"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(cliente.id)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                      title="Eliminar cliente"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Información del cliente organizada */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {/* Información de contacto */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Información de Contacto
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <PhoneIcon className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Teléfono</p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{cliente.telefono}</p>
                        </div>
                      </div>
                      
                      {cliente.email && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                          <FiMail className="h-5 w-5 text-blue-500" />
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{cliente.email}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Información personal */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Información Personal
                    </h4>
                    <div className="space-y-2">
                      {cliente.sexo && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                          <BsGenderAmbiguous className="h-5 w-5 text-purple-500" />
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Sexo</p>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{cliente.sexo}</p>
                          </div>
                        </div>
                      )}
                      
                      {cliente.direccion && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                          <FiMapPin className="h-5 w-5 text-green-500" />
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Dirección</p>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{cliente.direccion}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notas */}
                {cliente.notas && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                      Notas
                    </h4>
                    <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                      <FiFileText className="h-5 w-5 text-yellow-500 mt-0.5" />
                      <p className="text-gray-800 dark:text-gray-200">{cliente.notas}</p>
                    </div>
                  </div>
                )}

                {/* Botones de acción */}
                <div className="flex gap-3">
                  <button
                    onClick={async () => {
                      if (!cliente.telefono || cliente.telefono.trim() === '') {
                        const result = await Swal.fire({
                          title: 'Sin teléfono registrado',
                          text: 'Este cliente no tiene un número de teléfono guardado. Por favor, regístralo para poder llamar.',
                          icon: 'warning',
                          showCancelButton: true,
                          confirmButtonText: 'Editar',
                          cancelButtonText: 'Cancelar',
                        });
                        if (result.isConfirmed) {
                          setClienteEditando(cliente);
                          setShowModal(true);
                        }
                        return;
                      }
                      window.open(`tel:${cliente.telefono}`);
                    }}
                    className="flex-1 flex items-center justify-center gap-3 py-3 text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-400 rounded-xl transition-colors font-medium"
                  >
                    <PhoneIcon className="h-5 w-5" />
                    Llamar
                  </button>
                  <button
                    onClick={async () => {
                      if (!cliente.email || cliente.email.trim() === '') {
                        const result = await Swal.fire({
                          title: 'Sin email registrado',
                          text: 'Este cliente no tiene un email guardado. ¿Deseas agregarle uno?',
                          icon: 'warning',
                          showCancelButton: true,
                          confirmButtonText: 'Agregar Email',
                          cancelButtonText: 'Cancelar',
                        });
                        if (result.isConfirmed) {
                          setClienteEditando(cliente);
                          setShowModal(true);
                        }
                        return;
                      }
                      // Enviar email directo
                      const subject = encodeURIComponent('Mensaje desde ' + (window.location.hostname || 'Tu Negocio'));
                      const body = encodeURIComponent('Hola ' + cliente.nombre + ',\n\nEspero que estés bien.\n\nSaludos,\nTu Negocio');
                      window.open(`mailto:${cliente.email}?subject=${subject}&body=${body}`);
                    }}
                    className="flex-1 flex items-center justify-center gap-3 py-3 text-purple-600 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 dark:text-purple-400 rounded-xl transition-colors font-medium"
                  >
                    <FiMail className="h-5 w-5" />
                    Email
                  </button>
                  <button
                    onClick={async () => {
                      if (!cliente.telefono || cliente.telefono.trim() === '') {
                        const result = await Swal.fire({
                          title: 'Sin teléfono registrado',
                          text: 'Este cliente no tiene un número de teléfono guardado. Por favor, regístralo para poder enviar mensajes.',
                          icon: 'warning',
                          showCancelButton: true,
                          confirmButtonText: 'Editar',
                          cancelButtonText: 'Cancelar',
                        });
                        if (result.isConfirmed) {
                          setClienteEditando(cliente);
                          setShowModal(true);
                        }
                        return;
                      }
                      setClienteParaMensaje(cliente);
                      setShowMensajeModal(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-3 py-3 text-green-600 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-400 rounded-xl transition-colors font-medium"
                  >
                    <ChatBubbleLeftIcon className="h-5 w-5" />
                    Mensaje
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <ClienteModal
          open={showModal}
          onClose={() => {
            setShowModal(false);
            if (clienteParaEmail) {
              setTimeout(() => {
                setShowEmailModal(true);
              }, 300);
            }
            setClienteParaEmail(null);
          }}
          onCreated={() => {
            fetchClientes();
            if (clienteParaEmail) {
              setTimeout(() => {
                setShowEmailModal(true);
              }, 300);
            }
            setClienteParaEmail(null);
          }}
          cliente={clienteEditando}
        />
        <MensajeWhatsappModal
          open={showMensajeModal}
          onClose={() => setShowMensajeModal(false)}
          cliente={clienteParaMensaje}
        />
        {showEmailModal && (
          <EnviarEmailModal
            open={showEmailModal}
            onClose={() => setShowEmailModal(false)}
            clientes={clientes}
            onEditCliente={(cliente: Cliente, ids: string[]) => {
              setShowEmailModal(false);
              setClienteEditando(cliente);
              setShowModal(true);
              setClienteParaEmail(cliente);
              setTimeout(() => {
                setShowEmailModal(true);
              }, 300);
              setTimeout(() => {
                setClientesPreseleccionados(ids);
              }, 350);
            }}
            clientesPreseleccionados={clientesPreseleccionados}
          />
        )}
      </div>
    </div>
  );
} 