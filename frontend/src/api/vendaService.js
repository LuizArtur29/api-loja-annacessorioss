import api from './api';

const BASE = '/vendas';

const vendaService = {
    getAll: (page = 0, size = 10, q = '') => api.get(BASE, { params: { page, size, q } }),
    getById: (id) => api.get(`${BASE}/${id}`),
    create: (data) => api.post(BASE, data),
    cancel: (id, motivo) => api.post(`${BASE}/${id}/cancelamento`, { motivo }),
};

export default vendaService;
