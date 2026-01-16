import api from './axios';

const apiPayment = {
    // Récupérer les plans
    getPlans: async () => {
        const response = await api.get('/api/payment/plans');
        return response.data;
    },

    // Créer un ordre de paiement (checkout simulé)
    createOrder: async (orderData) => {
        // orderData: { plan_id, payment_method }
        const response = await api.post('/api/payment/checkout', orderData);
        return response.data;
    },

    // PayPal: Créer un ordre
    createPaypalOrder: async (planId) => {
        const response = await api.post('/api/payment/paypal', { plan_id: planId });
        return response.data;
    },

    // PayPal: Capturer le paiement
    capturePaypalPayment: async (orderId) => {
        const response = await api.post('/api/payment/paypal/capture', { order_id: orderId });
        return response.data;
    },

    // Admin: PayPal Config
    getPaypalConfig: async () => {
        const response = await api.get('/api/admin/paypal/config');
        return response.data;
    },

    // Admin: Update PayPal Config
    updatePaypalConfig: async (config) => {
        const response = await api.patch('/api/admin/paypal/config', config);
        return response.data;
    }
};

export default apiPayment;
