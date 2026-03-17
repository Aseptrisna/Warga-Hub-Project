import api from './api';

export const patrolCheckpointsService = {
  async getAll(params?: any) {
    const response = await api.get('/patrol-checkpoints', { params });
    return response.data;
  },
  async getById(id: string) {
    const response = await api.get(`/patrol-checkpoints/${id}`);
    return response.data;
  },
  async create(data: any) {
    const response = await api.post('/patrol-checkpoints', data);
    return response.data;
  },
  async update(id: string, data: any) {
    const response = await api.patch(`/patrol-checkpoints/${id}`, data);
    return response.data;
  },
  async delete(id: string) {
    const response = await api.delete(`/patrol-checkpoints/${id}`);
    return response.data;
  },
  async regenerateQR(id: string) {
    const response = await api.post(`/patrol-checkpoints/${id}/regenerate-qr`);
    return response.data;
  },
};

export const patrolSchedulesService = {
  async getAll(params?: any) {
    const response = await api.get('/patrol-schedules', { params });
    return response.data;
  },
  async getById(id: string) {
    const response = await api.get(`/patrol-schedules/${id}`);
    return response.data;
  },
  async create(data: any) {
    const response = await api.post('/patrol-schedules', data);
    return response.data;
  },
  async update(id: string, data: any) {
    const response = await api.patch(`/patrol-schedules/${id}`, data);
    return response.data;
  },
  async delete(id: string) {
    const response = await api.delete(`/patrol-schedules/${id}`);
    return response.data;
  },
  async start(id: string) {
    const response = await api.post(`/patrol-schedules/${id}/start`);
    return response.data;
  },
  async complete(id: string, reportSummary?: string) {
    const response = await api.post(`/patrol-schedules/${id}/complete`, { reportSummary });
    return response.data;
  },
  async cancel(id: string, reason?: string) {
    const response = await api.post(`/patrol-schedules/${id}/cancel`, { reason });
    return response.data;
  },
  async getStatistics(params?: any) {
    const response = await api.get('/patrol-schedules/statistics', { params });
    return response.data;
  },
};

export const patrolLogsService = {
  async getAll(params?: any) {
    const response = await api.get('/patrol-logs', { params });
    return response.data;
  },
  async scan(data: any) {
    const response = await api.post('/patrol-logs/scan', data);
    return response.data;
  },
  async getStatistics(params?: any) {
    const response = await api.get('/patrol-logs/statistics', { params });
    return response.data;
  },
  async getScheduleLogs(scheduleId: string) {
    const response = await api.get(`/patrol-logs/schedule/${scheduleId}`);
    return response.data;
  },
};
