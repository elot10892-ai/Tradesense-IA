import axios from 'axios';

const api = axios.create({
    baseURL: 'http://127.0.0.1:5000', // Utilisation explicite de 127.0.0.1 pour éviter les ambiguïtés localhost
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to add token to every request
api.interceptors.request.use(
    (config) => {
        // Toujours récupérer le token le plus récent de localStorage
        const token = localStorage.getItem('token');
        if (token) {
            console.log(`[API] Attaching Token to ${config.url}`);
            config.headers.Authorization = `Bearer ${token}`;
        } else {
            console.warn(`[API] No Token found for ${config.url}`);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Global Error Handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.error("[API] 401 Unauthorized - Clearing Session");
            localStorage.removeItem('token');
            // Optionnel: window.location.href = '/login' si on veut forcer
        }
        return Promise.reject(error);
    }
);

export default api;
