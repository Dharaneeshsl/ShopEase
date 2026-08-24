import api from './api';

const unwrapError = (error, fallback) => {
  if (error.response?.data?.message) return new Error(error.response.data.message);
  if (error.request) return new Error('Network error. Please check your connection.');
  return new Error(fallback);
};

const paymentService = {
  getConfig: async () => {
    const { data } = await api.get('/payments/config');
    return data;
  },

  createStripeCheckoutSession: async (payload) => {
    try {
      const { data } = await api.post('/payments/stripe/create-checkout-session', payload);
      return data;
    } catch (error) {
      throw unwrapError(error, 'Unable to start Stripe Checkout');
    }
  },

  confirmStripeSession: async (sessionId, orderId) => {
    try {
      const { data } = await api.post('/payments/stripe/confirm-session', { sessionId, orderId });
      return data;
    } catch (error) {
      throw unwrapError(error, 'Unable to confirm Stripe payment');
    }
  },

  createPayPalOrder: async (payload) => {
    try {
      const { data } = await api.post('/payments/paypal/create-order', payload);
      return data;
    } catch (error) {
      throw unwrapError(error, 'Unable to start PayPal checkout');
    }
  },

  capturePayPalPayment: async ({ paypalOrderId, shopOrderId }) => {
    try {
      const { data } = await api.post('/payments/paypal/capture-payment', {
        paypalOrderId,
        shopOrderId,
        token: paypalOrderId,
      });
      return data;
    } catch (error) {
      throw unwrapError(error, 'Unable to capture PayPal payment');
    }
  },

  createCodPayment: async (payload) => {
    try {
      const { data } = await api.post('/payments/cod', payload);
      return data;
    } catch (error) {
      throw unwrapError(error, 'Unable to register cash-on-delivery payment');
    }
  },
};

export default paymentService;
