import { Link } from 'react-router-dom';
import { CheckIcon } from '@heroicons/react/24/outline';

const features = [
  'Gestión de clientes simplificada',
  'Plantillas de WhatsApp personalizadas',
  'Integración con Google Calendar',
  'Recordatorios automáticos',
  'Exportación a Excel',
  'Historial de ventas',
  'Notas y archivos por cliente',
  'Panel intuitivo tipo app'
];

const plans = [
  {
    name: 'Prueba Gratuita',
    price: '0',
    duration: '7 días',
    features: [
      'Hasta 50 clientes',
      'Funciones básicas',
      'Soporte por email',
      'Sin tarjeta de crédito'
    ],
    cta: 'Comenzar gratis',
    href: '/register'
  },
  {
    name: 'Profesional',
    price: '9.99',
    duration: 'por mes',
    features: [
      'Clientes ilimitados',
      'Todas las funciones',
      'Soporte prioritario',
      'Exportación a Excel',
      'Google Calendar',
      'Plantillas de WhatsApp'
    ],
    cta: 'Comenzar prueba gratuita',
    href: '/register',
    featured: true
  }
];

export default function Landing() {
  return (
    <div className="bg-white">
      {/* Header */}
      <header className="relative">
        <nav className="mx-auto max-w-7xl px-6 lg:px-8" aria-label="Top">
          <div className="flex w-full items-center justify-between border-b border-gray-200 py-6">
            <div className="flex items-center">
              <Link to="/">
                <span className="text-2xl font-bold text-blue-600">CRM</span>
              </Link>
            </div>
            <div className="ml-10 space-x-4">
              <Link
                to="/login"
                className="inline-block rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white hover:bg-blue-700"
              >
                Iniciar sesión
              </Link>
              <Link
                to="/register"
                className="inline-block rounded-md border border-transparent bg-white px-4 py-2 text-base font-medium text-blue-600 hover:bg-gray-50"
              >
                Registrarse
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <main>
        <div className="relative">
          <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="relative px-6 py-24 sm:py-32 lg:px-8">
              <div className="mx-auto max-w-2xl text-center">
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                  Gestiona tus clientes de manera simple y efectiva
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-600">
                  La herramienta perfecta para vendedores que quieren mantener organizados sus clientes, 
                  automatizar recordatorios y enviar mensajes de WhatsApp de forma eficiente.
                </p>
                <div className="mt-10 flex items-center justify-center gap-x-6">
                  <Link
                    to="/register"
                    className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    Comenzar prueba gratuita
                  </Link>
                  <a href="#features" className="text-sm font-semibold leading-6 text-gray-900">
                    Ver más <span aria-hidden="true">→</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div id="features" className="py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-blue-600">
                Todo lo que necesitas
              </h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Funcionalidades diseñadas para vendedores
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Herramientas simples pero poderosas que te ayudarán a mantener tu negocio organizado
                y tus clientes satisfechos.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                {features.map((feature) => (
                  <div key={feature} className="flex">
                    <CheckIcon className="h-6 w-6 flex-none text-blue-600" />
                    <div className="ml-4">
                      <dt className="text-base font-semibold leading-7 text-gray-900">
                        {feature}
                      </dt>
                    </div>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl sm:text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Planes simples y transparentes
              </h2>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Comienza gratis y escala según tus necesidades
              </p>
            </div>
            <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 gap-y-6 sm:mt-20 sm:gap-y-0 lg:max-w-4xl lg:grid-cols-2">
              {plans.map((plan, planIdx) => (
                <div
                  key={plan.name}
                  className={`flex flex-col justify-between rounded-3xl bg-white p-8 ring-1 ring-gray-200 xl:p-10 ${
                    plan.featured ? 'relative lg:z-10 lg:rounded-r-none' : 'lg:mt-8 lg:rounded-l-none'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-x-4">
                      <h3 className="text-lg font-semibold leading-8 text-gray-900">
                        {plan.name}
                      </h3>
                      {plan.featured && (
                        <p className="rounded-full bg-blue-600/10 px-2.5 py-1 text-xs font-semibold leading-5 text-blue-600">
                          Más popular
                        </p>
                      )}
                    </div>
                    <p className="mt-6 flex items-baseline gap-x-1">
                      <span className="text-4xl font-bold tracking-tight text-gray-900">
                        ${plan.price}
                      </span>
                      <span className="text-sm font-semibold leading-6 text-gray-600">
                        /{plan.duration}
                      </span>
                    </p>
                    <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex gap-x-3">
                          <CheckIcon className="h-6 w-5 flex-none text-blue-600" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Link
                    to={plan.href}
                    className={`mt-8 block rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                      plan.featured
                        ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-500 focus-visible:outline-blue-600'
                        : 'bg-white text-blue-600 ring-1 ring-inset ring-blue-200 hover:ring-blue-300'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="relative isolate mt-32 px-6 py-32 sm:mt-56 sm:py-40 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Comienza tu prueba gratuita hoy
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-600">
              7 días gratis, sin tarjeta de crédito. Descubre cómo podemos ayudarte a organizar
              y hacer crecer tu negocio.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                to="/register"
                className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Comenzar ahora
              </Link>
              <Link to="/login" className="text-sm font-semibold leading-6 text-gray-900">
                Ya tengo una cuenta <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
          <div className="flex justify-center space-x-6 md:order-2">
            <a href="#" className="text-gray-400 hover:text-gray-500">
              <span className="sr-only">Twitter</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>
          </div>
          <div className="mt-8 md:order-1 md:mt-0">
            <p className="text-center text-xs leading-5 text-gray-500">
              &copy; 2024 CRM. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
} 