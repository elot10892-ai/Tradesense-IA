import api from './axios';

const apiAuth = {
    // Connexion : Retourne { access_token, user }
    login: async (credentials) => {
        const response = await api.post('/api/auth/login', credentials);
        return response.data;
    },

    // Inscription : Retourne { access_token, user }
    register: async (userData) => {
        const response = await api.post('/api/auth/register', userData);
        return response.data;
    },

    // Récupérer le profil via le token
    getProfile: async () => {
        const response = await api.get('/api/auth/profile');
        return response.data;
    }
};

export default apiAuth;
