import axios from 'axios';

const api = axios.create({
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
        const isAuthRoute = window.location.pathname.includes('/login');

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
