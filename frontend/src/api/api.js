import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor de request — injeta token JWT
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('anna_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Interceptor de response — redireciona ao login em 401/403
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            // Não redireciona se já estiver na rota de login
            if (!window.location.pathname.includes('/login')) {
                localStorage.removeItem('anna_token');
                localStorage.removeItem('anna_user');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
