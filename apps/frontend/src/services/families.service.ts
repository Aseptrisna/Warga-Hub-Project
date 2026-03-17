import api from './api';

export const familiesService = {
  async getAll(params?: any) {
    const response = await api.get('/families', { params });
    return response.data;
  },

  async getById(id: string) {
    const response = await api.get(`/families/${id}`);
    return response.data;
  },

  async getMembers(id: string) {
    const response = await api.get(`/families/${id}/members`);
    return response.data;
  },

  async create(data: any) {
    const response = await api.post('/families', data);
    return response.data;
  },

  async update(id: string, data: any) {
    const response = await api.patch(`/families/${id}`, data);
    return response.data;
  },

  async delete(id: string) {
    const response = await api.delete(`/families/${id}`);
    return response.data;
  },

  async syncMembers(id: string) {
    const response = await api.patch(`/families/${id}/sync-members`);
    return response.data;
  },

  async getStatistics(params?: any) {
    const response = await api.get('/families/statistics', { params });
    return response.data;
  },

  async uploadKK(id: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/families/${id}/upload-kk`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
