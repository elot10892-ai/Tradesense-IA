import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        'Content-Type': 'application/json',
    }
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

        // ✅ Supprime les headers cache-control qu'Axios pourrait ajouter automatiquement
        delete config.headers['cache-control'];
        delete config.headers['Cache-Control'];
        if (config.headers.common) {
            delete config.headers.common['cache-control'];
            delete config.headers.common['Cache-Control'];
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