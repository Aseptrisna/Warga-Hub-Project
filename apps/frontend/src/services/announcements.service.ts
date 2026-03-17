import api from './api';

export const announcementsService = {
  async getAll(params?: any) {
    const response = await api.get('/announcements', { params });
    return response.data;
  },

  async getById(id: string) {
    const response = await api.get(`/announcements/${id}`);
    return response.data;
  },

  async create(data: any) {
    const response = await api.post('/announcements', data);
    return response.data;
  },

  async update(id: string, data: any) {
    const response = await api.patch(`/announcements/${id}`, data);
    return response.data;
  },

  async togglePin(id: string) {
    const response = await api.patch(`/announcements/${id}/pin`);
    return response.data;
  },

  async delete(id: string) {
    const response = await api.delete(`/announcements/${id}`);
    return response.data;
  },
};
