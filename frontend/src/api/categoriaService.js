import api from './api';

const BASE = '/categorias';

const categoriaService = {
    getAll: () => api.get(BASE),
    getById: (id) => api.get(`${BASE}/${id}`),
    create: (data) => api.post(BASE, data),
    update: (id, data) => api.put(`${BASE}/${id}`, data),
    delete: (id) => api.delete(`${BASE}/${id}`),
};

export default categoriaService;
