import api from './api';

const dashboardService = {
    getResumo: (ano, mes) => api.get('/dashboard', { params: { ano, mes } }),
};

export default dashboardService;
