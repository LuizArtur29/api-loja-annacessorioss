import api from './api';

const TOKEN_KEY = 'anna_token';
const USER_KEY = 'anna_user';

const authService = {
    login: async (username, senha) => {
        const res = await api.post('/auth/login', { username, senha });
        const { token, username: user, role } = res.data;
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify({ username: user, role }));
        return res.data;
    },

    logout: () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    },

    getToken: () => localStorage.getItem(TOKEN_KEY),

    getUser: () => {
        const raw = localStorage.getItem(USER_KEY);
        return raw ? JSON.parse(raw) : null;
    },

    isAuthenticated: () => !!localStorage.getItem(TOKEN_KEY),
};

export default authService;
