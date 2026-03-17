import api from './api';

export const panicService = {
  async getAll(params?: any) {
    const response = await api.get('/panic', { params });
    return response.data;
  },
  async getMy(params?: any) {
    const response = await api.get('/panic/my', { params });
    return response.data;
  },
  async getActive(params?: any) {
    const response = await api.get('/panic/active', { params });
    return response.data;
  },
  async create(data: any, foto?: File) {
    const formData = new FormData();
    formData.append('tipeEmergency', data.tipeEmergency);
    if (data.deskripsi) formData.append('deskripsi', data.deskripsi);
    if (data.lokasi) formData.append('lokasi', JSON.stringify(data.lokasi));
    if (foto) formData.append('foto', foto);
    const response = await api.post('/panic', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  async respond(id: string, tindakan: string) {
    const response = await api.patch(`/panic/${id}/respond`, { tindakan });
    return response.data;
  },
  async resolve(id: string, tindakan?: string) {
    const response = await api.patch(`/panic/${id}/resolve`, { tindakan });
    return response.data;
  },
  async getStatistics(params?: any) {
    const response = await api.get('/panic/statistics', { params });
    return response.data;
  },
};
