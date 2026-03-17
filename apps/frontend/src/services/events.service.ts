import api from './api';

export const eventsService = {
  async getAll(params?: any) {
    const response = await api.get('/events', { params });
    return response.data;
  },
  async getById(id: string) {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },
  async create(data: any) {
    const response = await api.post('/events', data);
    return response.data;
  },
  async update(id: string, data: any) {
    const response = await api.patch(`/events/${id}`, data);
    return response.data;
  },
  async register(id: string) {
    const response = await api.post(`/events/${id}/register`);
    return response.data;
  },
  async unregister(id: string) {
    const response = await api.post(`/events/${id}/unregister`);
    return response.data;
  },
  async getStatistics(params?: any) {
    const response = await api.get('/events/statistics', { params });
    return response.data;
  },
  async delete(id: string) {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  },
};
