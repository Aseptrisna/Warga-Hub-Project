import api from './api';

export const dashboardService = {
  async getSummary(params?: Record<string, string>) {
    const response = await api.get('/dashboard/summary', { params });
    return response.data;
  },

  async getChartData(period?: string, params?: Record<string, string>) {
    const response = await api.get('/dashboard/charts', { params: { period, ...params } });
    return response.data;
  },
};
