import api from './api';

export const guestbookService = {
  async getAll(params?: any) {
    const response = await api.get('/guestbook', { params });
    return response.data;
  },

  async getById(id: string) {
    const response = await api.get(`/guestbook/${id}`);
    return response.data;
  },

  async create(data: any) {
    const response = await api.post('/guestbook', data);
    return response.data;
  },

  async update(id: string, data: any) {
    const response = await api.patch(`/guestbook/${id}`, data);
    return response.data;
  },

  async checkout(id: string) {
    const response = await api.patch(`/guestbook/${id}/checkout`);
    return response.data;
  },

  async delete(id: string) {
    const response = await api.delete(`/guestbook/${id}`);
    return response.data;
  },

  async getStatistics(params?: any) {
    const response = await api.get('/guestbook/statistics', { params });
    return response.data;
  },
};
