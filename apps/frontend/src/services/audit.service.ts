import api from './api';

export const auditService = {
  async getAll(params?: any) {
    const response = await api.get('/audit-logs', { params });
    return response.data;
  },

  async getStatistics() {
    const response = await api.get('/audit-logs/statistics');
    return response.data;
  },
};
