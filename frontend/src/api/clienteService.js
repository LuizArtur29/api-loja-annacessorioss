import api from './api';

const BASE = '/clientes';

const clienteService = {
    getAll: (page = 0, size = 10, q = '') => api.get(BASE, { params: { page, size, q } }),
    getAllNoPagination: () => api.get(`${BASE}/all`),
    getBirthdayCustomers: (date) => api.get(`${BASE}/aniversariantes`, { params: { data: date } }),
    getById: (id) => api.get(`${BASE}/${id}`),
    create: (data) => api.post(BASE, data),
    update: (id, data) => api.put(`${BASE}/${id}`, data),
    delete: (id) => api.delete(`${BASE}/${id}`),
};

export default clienteService;
