import api from './api';

const despesaService = {
    getAll: () => api.get('/despesas'),
    create: (data) => api.post('/despesas', data),
    delete: (id) => api.delete(`/despesas/${id}`),
};

export default despesaService;