import api from './api';

export const paymentsService = {
  async getAll(params?: any) {
    const response = await api.get('/payments', { params });
    return response.data;
  },

  async getMy(params?: any) {
    const response = await api.get('/payments/my', { params });
    return response.data;
  },

  async getById(id: string) {
    const response = await api.get(`/payments/${id}`);
    return response.data;
  },

  async create(data: any) {
    const response = await api.post('/payments', data);
    return response.data;
  },

  async update(id: string, data: any) {
    const response = await api.patch(`/payments/${id}`, data);
    return response.data;
  },

  async delete(id: string) {
    const response = await api.delete(`/payments/${id}`);
    return response.data;
  },

  async getStatistics(params?: any) {
    const response = await api.get('/payments/statistics', { params });
    return response.data;
  },

  async uploadBukti(id: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/payments/${id}/upload-bukti`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async verify(id: string, data: { status: 'Lunas' | 'Ditolak'; rejectionReason?: string }) {
    const response = await api.patch(`/payments/${id}/verify`, data);
    return response.data;
  },

  async getMatrix(params?: any) {
    const response = await api.get('/payments/matrix', { params });
    return response.data;
  },

  async generateBulk(data: { bulan: number; tahun: number }) {
    const response = await api.post('/payments/generate-bulk', data);
    return response.data;
  },
};
