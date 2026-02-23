import api from './api';

const BASE = '/produtos';

const produtoService = {
    getAll: (page = 0, size = 10) => api.get(BASE, { params: { page, size } }),
    getAllNoPagination: () => api.get(`${BASE}/all`),
    getById: (id) => api.get(`${BASE}/${id}`),
    create: (data) => api.post(BASE, data),
    update: (id, data) => api.put(`${BASE}/${id}`, data),
    delete: (id) => api.delete(`${BASE}/${id}`),
    getValorTotal: () => api.get(`${BASE}/valor-total`),
};

export default produtoService;
