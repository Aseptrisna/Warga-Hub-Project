import api from './api';

export const iuranTypesService = {
  async getAll(params?: any) {
    const response = await api.get('/iuran-types', { params });
    return response.data;
  },

  async getApplicable() {
    const response = await api.get('/iuran-types/applicable');
    return response.data;
  },

  async getById(id: string) {
    const response = await api.get(`/iuran-types/${id}`);
    return response.data;
  },

  async create(data: any) {
    const response = await api.post('/iuran-types', data);
    return response.data;
  },

  async update(id: string, data: any) {
    const response = await api.patch(`/iuran-types/${id}`, data);
    return response.data;
  },

  async delete(id: string) {
    const response = await api.delete(`/iuran-types/${id}`);
    return response.data;
  },
};
