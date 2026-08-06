import api from './api';

const despesaService = {
    getAll: (page = 0, size = 10, ano, mes, q = '') =>
        api.get('/despesas', { params: { page, size, ano, mes, q } }),
    getById: (id) => api.get(`/despesas/${id}`),
    create: (data) => api.post('/despesas', data),
    update: (id, data) => api.put(`/despesas/${id}`, data),
    delete: (id) => api.delete(`/despesas/${id}`),
};

export default despesaService;
