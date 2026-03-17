import api from './api';

export const reportsService = {
  async getAll(params?: any) {
    const response = await api.get('/reports', { params });
    return response.data;
  },
  async getMy(params?: any) {
    const response = await api.get('/reports/my', { params });
    return response.data;
  },
  async getById(id: string) {
    const response = await api.get(`/reports/${id}`);
    return response.data;
  },
  async create(data: any) {
    const response = await api.post('/reports', data);
    return response.data;
  },
  async updateStatus(id: string, status: string, tanggapan: string) {
    const response = await api.patch(`/reports/${id}/status`, { status, tanggapan });
    return response.data;
  },
  async getStatistics(params?: any) {
    const response = await api.get('/reports/statistics', { params });
    return response.data;
  },
  async delete(id: string) {
    const response = await api.delete(`/reports/${id}`);
    return response.data;
  },
};
