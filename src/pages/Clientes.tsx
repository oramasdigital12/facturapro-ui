import { useEffect, useState } from 'react';
import api from '../services/api';
import { FiSearch, FiMail, FiMapPin, FiCalendar, FiFileText } from 'react-icons/fi';
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
  fecha_nacimiento?: string;
  sexo?: string;
  direccion?: string;
  notas?: string;
  fecha_inicio?: string;
  fecha_vencimiento?: string;
}

const categorias = [
  { label: 'Todos', value: '', color: 'blue' },
  { label: 'Activo', value: 'activo', color: 'green' },
  { label: 'Pendiente', value: 'pendiente', color: 'yellow' },
  { label: 'Por vencer', value: 'por_vencer', color: 'orange' },
  { label: 'Vencido', value: 'Vencido', color: 'red' },
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
  console.log('color_personalizado CLIENTES', color_personalizado);

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
    'por_vencer': clientes.filter(c => c.categoria === 'por_vencer').length,
    'Vencido': clientes.filter(c => c.categoria === 'Vencido').length,
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

  // Función para calcular la edad a partir de la fecha de nacimiento
  function calcularEdad(fecha: string) {
    if (!fecha) return '';
    const hoy = new Date();
    const nacimiento = new Date(fecha);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad >= 0 ? edad : '';
  }

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

      <div className="relative flex-1 flex flex-col px-4 pb-24">
        <div className="text-center mb-8 mt-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Clientes</h1>
          <div className="w-16 h-1 mx-auto rounded-full" style={{ background: `${color_personalizado} !important` }}></div>
        </div>

        <div className="flex flex-col gap-4 mb-6">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre..."
              className="w-full pl-10 pr-3 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </div>
          <div className="flex gap-2 justify-center mb-6 flex-wrap">
            {categorias.map(cat => (
              <button
                key={cat.value}
                className={`flex flex-col items-center px-3 py-2 rounded-xl border-2 transition-all duration-200 min-w-[70px] max-w-[90px] focus:outline-none
                  ${categoria === cat.value 
                    ? `border-${cat.color}-600 bg-${cat.color}-50 text-${cat.color}-700` 
                    : `border-gray-200 bg-white text-gray-700 hover:border-${cat.color}-400 hover:text-${cat.color}-600`}
                `}
                onClick={() => setCategoria(cat.value)}
              >
                <span className={`mb-1 text-xs font-bold rounded-full px-2 py-0.5
                  ${cat.color === 'blue' ? 'bg-blue-500 text-white' :
                    cat.color === 'green' ? 'bg-green-500 text-white' :
                    cat.color === 'yellow' ? 'bg-yellow-400 text-white' :
                    cat.color === 'orange' ? 'bg-orange-500 text-white' :
                    'bg-red-500 text-white'}
                `}>
                  {contadores[cat.value as keyof typeof contadores]}
                </span>
                <span className="text-xs font-medium">{cat.label}</span>
              </button>
            ))}
          </div>
          {/* Botón de email y crear cliente justo encima del listado de clientes */}
          <div className="flex justify-between items-center mb-2 gap-2">
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
                className="p-4 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors shadow-sm"
                title="Enviar email"
                style={{ boxShadow: '0 2px 8px rgba(59,130,246,0.10)' }}
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
          <div className="text-center py-8">Cargando...</div>
        ) : clientesMostrados.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No hay clientes.</div>
        ) : (
          <ul className="space-y-4">
            {clientesMostrados.map((cliente) => (
              <li key={cliente.id} className="bg-white rounded-xl shadow-sm p-4 relative">
                <div className="flex gap-2 mb-1 items-start">
                  <UserIcon className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start">
                      <h3 className="font-medium text-gray-900 leading-snug flex-1 min-w-0 break-words whitespace-pre-line">{cliente.nombre}</h3>
                      <div className="flex gap-2 flex-shrink-0 ml-2">
                        <button
                          onClick={() => {
                            setClienteEditando(cliente);
                            setShowModal(true);
                          }}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(cliente.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mb-3">
                  {/* Información de contacto */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2">
                      <PhoneIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{cliente.telefono}</span>
                    </div>
                    
                    {cliente.email && (
                      <div className="flex items-center gap-2">
                        <FiMail className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{cliente.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Detalles personales */}
                  <div className="space-y-2 mb-3">
                    {cliente.sexo && (
                      <div className="flex items-center gap-2">
                        <BsGenderAmbiguous className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{cliente.sexo}</span>
                      </div>
                    )}
                    
                    {cliente.direccion && (
                      <div className="flex items-center gap-2">
                        <FiMapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{cliente.direccion}</span>
                      </div>
                    )}

                    {cliente.fecha_nacimiento && cliente.fecha_nacimiento !== '9999-12-31' && (
                      <div className="flex items-center gap-2">
                        <FiCalendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {cliente.fecha_nacimiento}
                          <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                            {calcularEdad(cliente.fecha_nacimiento)} años
                          </span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Fechas de membresía */}
                  {(cliente.fecha_inicio !== '9999-12-31' || cliente.fecha_vencimiento !== '9999-12-31') && (
                    <div className="border-t border-gray-100 pt-2 mt-2 space-y-2">
                      {cliente.fecha_inicio !== '9999-12-31' && (
                        <div className="flex items-center gap-2">
                          <FiCalendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">Desde: {cliente.fecha_inicio}</span>
                        </div>
                      )}
                      {cliente.fecha_vencimiento !== '9999-12-31' && (
                        <div className="flex items-center gap-2">
                          <FiCalendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">Hasta: {cliente.fecha_vencimiento}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notas */}
                  {cliente.notas && (
                    <div className="border-t border-gray-100 pt-2 mt-2">
                      <div className="flex items-start gap-2">
                        <FiFileText className="h-4 w-4 text-gray-400 mt-0.5" />
                        <span className="text-sm text-gray-600">{cliente.notas}</span>
                      </div>
                    </div>
                  )}

                  {/* Estado */}
                  <div className="mt-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      cliente.categoria === 'activo' ? 'bg-green-100 text-green-800' :
                      cliente.categoria === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                      cliente.categoria === 'por_vencer' ? 'bg-orange-100 text-orange-800' :
                      cliente.categoria === 'Vencido' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {cliente.categoria}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
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
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                  >
                    <PhoneIcon className="h-5 w-5" />
                    <span className="font-medium">Llamar</span>
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
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 text-green-600 bg-green-50 hover:bg-green-100 rounded-xl transition-colors"
                  >
                    <ChatBubbleLeftIcon className="h-5 w-5" />
                    <span className="font-medium">Mensaje</span>
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