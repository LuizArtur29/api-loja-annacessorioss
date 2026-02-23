import api from './api';

const BASE = '/vendas';

const vendaService = {
    getAll: (page = 0, size = 10) => api.get(BASE, { params: { page, size } }),
    getAllNoPagination: () => api.get(`${BASE}/all`),
    getById: (id) => api.get(`${BASE}/${id}`),
    create: (data) => api.post(BASE, data),
    delete: (id) => api.delete(`${BASE}/${id}`),
};

export default vendaService;
