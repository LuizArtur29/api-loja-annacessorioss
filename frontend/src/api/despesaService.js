import api from './api';

const despesaService = {
    getAll: () => api.get('/despesas'),
    getById: (id) => api.get(`/despesas/${id}`),
    create: (data) => api.post('/despesas', data),
    update: (id, data) => api.put(`/despesas/${id}`, data),
    delete: (id) => api.delete(`/despesas/${id}`),
};

export default despesaService;