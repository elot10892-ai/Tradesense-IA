import axios from 'axios';

// Récupère l'URL du backend depuis la variable d'environnement Vite
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

const api = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});


// Interceptor to add token to every request
api.interceptors.request.use(
    (config) => {
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
            // window.location.href = '/login' // Optionnel pour rediriger
        }
        return Promise.reject(error);
    }
);

export default api;
