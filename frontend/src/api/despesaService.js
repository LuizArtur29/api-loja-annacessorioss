import api from './api';

const despesaService = {
    getAll: (page = 0, size = 10) => api.get('/despesas', { params: { page, size } }),
    getAllNoPagination: () => api.get('/despesas/all'),
    getById: (id) => api.get(`/despesas/${id}`),
    create: (data) => api.post('/despesas', data),
    update: (id, data) => api.put(`/despesas/${id}`, data),
    delete: (id) => api.delete(`/despesas/${id}`),
};

export default despesaService;