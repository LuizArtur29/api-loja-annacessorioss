import api from './api';

const BASE = '/vendas';

const vendaService = {
    getAll: () => api.get(BASE),
    getById: (id) => api.get(`${BASE}/${id}`),
    create: (data) => api.post(BASE, data),
};

export default vendaService;
