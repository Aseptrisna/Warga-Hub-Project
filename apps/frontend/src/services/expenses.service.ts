import api from './api';

export const expensesService = {
  async getAll(params?: any) {
    const response = await api.get('/expenses', { params });
    return response.data;
  },

  async getById(id: string) {
    const response = await api.get(`/expenses/${id}`);
    return response.data;
  },

  async create(data: any) {
    const response = await api.post('/expenses', data);
    return response.data;
  },

  async update(id: string, data: any) {
    const response = await api.patch(`/expenses/${id}`, data);
    return response.data;
  },

  async approve(id: string) {
    const response = await api.patch(`/expenses/${id}/approve`);
    return response.data;
  },

  async reject(id: string, reason?: string) {
    const response = await api.patch(`/expenses/${id}/reject`, { reason });
    return response.data;
  },

  async delete(id: string) {
    const response = await api.delete(`/expenses/${id}`);
    return response.data;
  },

  async getStatistics(params?: any) {
    const response = await api.get('/expenses/statistics', { params });
    return response.data;
  },

  async uploadBukti(id: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/expenses/${id}/upload-bukti`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
