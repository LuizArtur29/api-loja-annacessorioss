import axios from 'axios';

const api = axios.create({
    // 1. Garantimos que a URL base termine com /api para bater com seu @RequestMapping
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('anna_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // 2. Ajuste de segurança: Não redirecionar se o erro for na rota de registro ou login
        const isAuthRoute = window.location.pathname.includes('/login') ||
            window.location.pathname.includes('/register');

        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            if (!isAuthRoute) {
                localStorage.removeItem('anna_token');
                localStorage.removeItem('anna_user');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;