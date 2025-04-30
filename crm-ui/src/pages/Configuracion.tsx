import { useState, useEffect } from 'react';
import { useConfig, TEMPLATE_VARIABLES } from '../contexts/ConfigContext';
import { PlusIcon, TrashIcon, CheckIcon, KeyIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useGoogleCalendar } from '../contexts/GoogleCalendarContext';
import toast from 'react-hot-toast';
import api from '../lib/api';

export default function Configuracion() {
  const { user, updateProfile } = useAuth();
  const {
    isGoogleCalendarConnected,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    whatsappTemplates,
    saveWhatsappTemplate,
    deleteWhatsappTemplate,
    previewTemplate
  } = useConfig();

  const {
    subscription,
    plans,
    isLoading: isLoadingSubscription,
    subscribe,
    cancelSubscription,
    resumeSubscription
  } = useSubscription();

  const { isConnected, connect, disconnect } = useGoogleCalendar();

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    nombre: user?.nombre || '',
    negocio: user?.negocio || '',
    tipo_negocio: user?.tipo_negocio || '',
    direccion: user?.direccion || '',
    telefono: user?.telefono || ''
  });

  const [nuevaPlantilla, setNuevaPlantilla] = useState({
    nombre: '',
    mensaje: '',
    categoria: 'general' as const
  });

  const [previewVariables, setPreviewVariables] = useState<Record<string, string>>({});

  const [integracionesForm, setIntegracionesForm] = useState({
    google_client_id: '',
    google_client_secret: '',
    stripe_public_key: '',
    stripe_secret_key: '',
    whatsapp_api_key: ''
  });

  const [mostrarClaves, setMostrarClaves] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await updateProfile(form);
      setIsEditing(false);
      toast.success('Perfil actualizado correctamente');
    } catch (error) {
      toast.error('Error al actualizar el perfil');
    }
  }

  async function guardarPlantilla(e: React.FormEvent) {
    e.preventDefault();
    await saveWhatsappTemplate(nuevaPlantilla);
    setNuevaPlantilla({ nombre: '', mensaje: '', categoria: 'general' });
  }

  async function guardarIntegraciones(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post('/configuracion/integraciones', integracionesForm);
      toast.success('Configuración de integraciones actualizada');
    } catch (error) {
      toast.error('Error al actualizar las integraciones');
      console.error('Error:', error);
    }
  }

  useEffect(() => {
    async function cargarConfiguraciones() {
      try {
        const response = await api.get('/configuracion/integraciones');
        setIntegracionesForm(response.data);
      } catch (error) {
        console.error('Error al cargar configuraciones:', error);
      }
    }
    cargarConfiguraciones();
  }, []);

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        {/* Perfil */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Perfil del Negocio
            </h3>
            {isEditing ? (
              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div>
                  <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="negocio" className="block text-sm font-medium text-gray-700">
                    Nombre del negocio
                  </label>
                  <input
                    type="text"
                    id="negocio"
                    value={form.negocio}
                    onChange={(e) => setForm({ ...form, negocio: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="tipo_negocio" className="block text-sm font-medium text-gray-700">
                    Tipo de negocio
                  </label>
                  <input
                    type="text"
                    id="tipo_negocio"
                    value={form.tipo_negocio}
                    onChange={(e) => setForm({ ...form, tipo_negocio: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="direccion" className="block text-sm font-medium text-gray-700">
                    Dirección
                  </label>
                  <input
                    type="text"
                    id="direccion"
                    value={form.direccion}
                    onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    id="telefono"
                    value={form.telefono}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-5 space-y-4">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Nombre</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user?.nombre}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Negocio</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user?.negocio}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Tipo de negocio</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user?.tipo_negocio}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Dirección</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user?.direccion}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user?.telefono}</dd>
                  </div>
                </dl>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700"
                  >
                    Editar perfil
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Suscripción */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Suscripción
            </h3>
            <div className="mt-5">
              {subscription ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Plan actual</p>
                    <p className="mt-1 text-lg font-medium text-gray-900">
                      {subscription.plan.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Estado</p>
                    <p className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        subscription.status === 'active' ? 'bg-green-100 text-green-800' :
                        subscription.status === 'trialing' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {subscription.status === 'active' ? 'Activa' :
                         subscription.status === 'trialing' ? 'En prueba' :
                         'Cancelada'}
                      </span>
                    </p>
                  </div>
                  {subscription.trial_end && (
                    <div>
                      <p className="text-sm text-gray-500">Prueba termina el</p>
                      <p className="mt-1 text-sm text-gray-900">
                        {new Date(subscription.trial_end).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500">Próximo cobro</p>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(subscription.current_period_end).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex justify-end">
                    {subscription.cancel_at_period_end ? (
                      <button
                        type="button"
                        onClick={resumeSubscription}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700"
                      >
                        Reactivar suscripción
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={cancelSubscription}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700"
                      >
                        Cancelar suscripción
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    No tienes una suscripción activa
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {plans.map((plan) => (
                      <div
                        key={plan.id}
                        className="border rounded-lg p-4 space-y-4"
                      >
                        <h4 className="text-lg font-medium text-gray-900">{plan.name}</h4>
                        <p className="text-2xl font-bold text-gray-900">
                          ${plan.price}<span className="text-sm font-normal text-gray-500">/mes</span>
                        </p>
                        <ul className="space-y-2">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-center text-sm text-gray-500">
                              <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              {feature}
                            </li>
                          ))}
                        </ul>
                        {plan.id !== 'free' && (
                          <button
                            type="button"
                            onClick={() => subscribe(plan.stripe_price_id)}
                            className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700"
                          >
                            Suscribirse
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Google Calendar */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Google Calendar
            </h3>
            <div className="mt-5">
              {isConnected ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    Tu cuenta está conectada con Google Calendar
                  </p>
                  <button
                    type="button"
                    onClick={disconnect}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700"
                  >
                    Desconectar
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    Conecta tu cuenta con Google Calendar para sincronizar eventos y recordatorios
                  </p>
                  <button
                    type="button"
                    onClick={connect}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700"
                  >
                    Conectar con Google Calendar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Integraciones */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Integraciones</h2>
            <button
              onClick={() => setMostrarClaves(!mostrarClaves)}
              className="flex items-center text-sm text-blue-600 hover:text-blue-500"
            >
              <KeyIcon className="h-4 w-4 mr-1" />
              {mostrarClaves ? 'Ocultar claves' : 'Mostrar claves'}
            </button>
          </div>

          <form onSubmit={guardarIntegraciones} className="space-y-6">
            {/* Google Calendar */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Google Calendar</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Client ID</label>
                  <input
                    type={mostrarClaves ? "text" : "password"}
                    value={integracionesForm.google_client_id}
                    onChange={(e) => setIntegracionesForm({...integracionesForm, google_client_id: e.target.value})}
                    className="w-full px-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Google Client ID"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Client Secret</label>
                  <input
                    type={mostrarClaves ? "text" : "password"}
                    value={integracionesForm.google_client_secret}
                    onChange={(e) => setIntegracionesForm({...integracionesForm, google_client_secret: e.target.value})}
                    className="w-full px-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Google Client Secret"
                  />
                </div>
              </div>
            </div>

            {/* Stripe */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Stripe</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Public Key</label>
                  <input
                    type={mostrarClaves ? "text" : "password"}
                    value={integracionesForm.stripe_public_key}
                    onChange={(e) => setIntegracionesForm({...integracionesForm, stripe_public_key: e.target.value})}
                    className="w-full px-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Stripe Public Key"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Secret Key</label>
                  <input
                    type={mostrarClaves ? "text" : "password"}
                    value={integracionesForm.stripe_secret_key}
                    onChange={(e) => setIntegracionesForm({...integracionesForm, stripe_secret_key: e.target.value})}
                    className="w-full px-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Stripe Secret Key"
                  />
                </div>
              </div>
            </div>

            {/* WhatsApp API */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">WhatsApp Business API</h3>
              <div>
                <label className="block text-sm text-gray-600 mb-1">API Key</label>
                <input
                  type={mostrarClaves ? "text" : "password"}
                  value={integracionesForm.whatsapp_api_key}
                  onChange={(e) => setIntegracionesForm({...integracionesForm, whatsapp_api_key: e.target.value})}
                  className="w-full px-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="WhatsApp API Key"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
              >
                Guardar configuración
              </button>
            </div>
          </form>
        </div>

        {/* Plantillas de WhatsApp */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Plantillas de WhatsApp</h2>
          
          <form onSubmit={guardarPlantilla} className="mb-6 space-y-4">
            <div>
              <input
                type="text"
                placeholder="Nombre de la plantilla"
                value={nuevaPlantilla.nombre}
                onChange={(e) => setNuevaPlantilla({...nuevaPlantilla, nombre: e.target.value})}
                className="w-full px-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <select
                value={nuevaPlantilla.categoria}
                onChange={(e) => setNuevaPlantilla({...nuevaPlantilla, categoria: e.target.value as any})}
                className="w-full px-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="general">General</option>
                <option value="vencimiento">Vencimiento</option>
                <option value="cumpleaños">Cumpleaños</option>
                <option value="recordatorio">Recordatorio</option>
              </select>
            </div>
            <div>
              <div className="mb-2 flex flex-wrap gap-2">
                {Object.entries(TEMPLATE_VARIABLES).map(([key, value]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      const textArea = document.getElementById('mensaje') as HTMLTextAreaElement;
                      if (textArea) {
                        const start = textArea.selectionStart;
                        const end = textArea.selectionEnd;
                        const texto = nuevaPlantilla.mensaje;
                        const nuevoTexto = texto.substring(0, start) + value + texto.substring(end);
                        setNuevaPlantilla({...nuevaPlantilla, mensaje: nuevoTexto});
                      }
                    }}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
                  >
                    {value}
                  </button>
                ))}
              </div>
              <textarea
                id="mensaje"
                placeholder="Mensaje"
                value={nuevaPlantilla.mensaje}
                onChange={(e) => setNuevaPlantilla({...nuevaPlantilla, mensaje: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Vista previa</h4>
              <div className="p-4 bg-gray-50 rounded-lg">
                {previewTemplate(nuevaPlantilla.mensaje, previewVariables)}
              </div>
              <div className="mt-2 space-y-2">
                {Object.keys(TEMPLATE_VARIABLES).map((key) => (
                  <input
                    key={key}
                    type="text"
                    placeholder={`Valor para ${TEMPLATE_VARIABLES[key as keyof typeof TEMPLATE_VARIABLES]}`}
                    value={previewVariables[key] || ''}
                    onChange={(e) => setPreviewVariables({...previewVariables, [key]: e.target.value})}
                    className="w-full px-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ))}
              </div>
            </div>
            <div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 flex items-center"
              >
                <PlusIcon className="h-5 w-5 mr-1" />
                Agregar plantilla
              </button>
            </div>
          </form>

          <div className="space-y-4">
            {whatsappTemplates.map((template) => (
              <div
                key={template.id}
                className="flex items-start justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">{template.nombre}</h3>
                    {template.categoria && (
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        template.categoria === 'vencimiento' ? 'bg-red-100 text-red-800' :
                        template.categoria === 'cumpleaños' ? 'bg-green-100 text-green-800' :
                        template.categoria === 'recordatorio' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {template.categoria}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mt-1">{template.mensaje}</p>
                  <p className="text-gray-400 text-xs mt-1">
                    Creada el {template.created_at ? new Date(template.created_at).toLocaleDateString() : 'Fecha no disponible'}
                  </p>
                </div>
                <button
                  onClick={() => deleteWhatsappTemplate(template.id)}
                  className="text-red-500 hover:text-red-600"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 