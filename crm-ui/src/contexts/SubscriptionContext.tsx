import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY || '');

interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  stripe_price_id: string;
}

interface Subscription {
  id: string;
  user_id: string;
  status: 'trialing' | 'active' | 'canceled' | 'incomplete' | 'past_due';
  plan: Plan;
  current_period_end: string;
  cancel_at_period_end: boolean;
  trial_end: string | null;
  stripe_customer_id: string;
  stripe_subscription_id: string;
}

interface SubscriptionContextType {
  subscription: Subscription | null;
  isLoading: boolean;
  plans: Plan[];
  subscribe: (priceId: string) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  resumeSubscription: () => Promise<void>;
  updatePaymentMethod: () => Promise<void>;
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Prueba Gratuita',
    price: 0,
    features: [
      'Hasta 50 clientes',
      'Funciones básicas',
      'Soporte por email',
      '7 días de prueba'
    ],
    stripe_price_id: ''
  },
  {
    id: 'pro',
    name: 'Profesional',
    price: 9.99,
    features: [
      'Clientes ilimitados',
      'Todas las funciones',
      'Soporte prioritario',
      'Exportación a Excel',
      'Google Calendar',
      'Plantillas de WhatsApp'
    ],
    stripe_price_id: process.env.REACT_APP_STRIPE_PRICE_ID || ''
  }
];

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadSubscription();
    }
  }, [user]);

  async function loadSubscription() {
    try {
      const response = await api.get('/subscriptions/current');
      setSubscription(response.data);
    } catch (error) {
      console.error('Error al cargar suscripción:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function subscribe(priceId: string) {
    try {
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe no está configurado');

      const response = await api.post('/subscriptions', { price_id: priceId });
      const { sessionId } = response.data;

      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) throw error;
    } catch (error) {
      toast.error('Error al procesar la suscripción');
      throw error;
    }
  }

  async function cancelSubscription() {
    try {
      await api.post('/subscriptions/cancel');
      await loadSubscription();
      toast.success('Suscripción cancelada');
    } catch (error) {
      toast.error('Error al cancelar la suscripción');
      throw error;
    }
  }

  async function resumeSubscription() {
    try {
      await api.post('/subscriptions/resume');
      await loadSubscription();
      toast.success('Suscripción reactivada');
    } catch (error) {
      toast.error('Error al reactivar la suscripción');
      throw error;
    }
  }

  async function updatePaymentMethod() {
    try {
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe no está configurado');

      const response = await api.post('/subscriptions/update-payment');
      const { sessionId } = response.data;

      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) throw error;
    } catch (error) {
      toast.error('Error al actualizar el método de pago');
      throw error;
    }
  }

  const value = {
    subscription,
    isLoading,
    plans: PLANS,
    subscribe,
    cancelSubscription,
    resumeSubscription,
    updatePaymentMethod
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription debe usarse dentro de un SubscriptionProvider');
  }
  return context;
} 