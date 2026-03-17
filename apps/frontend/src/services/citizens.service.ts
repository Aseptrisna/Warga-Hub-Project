import api from './api';

export interface Citizen {
  id: string;
  nik: string;
  namaLengkap: string;
  [key: string]: any;
}

export const citizensService = {
  async getAll(params?: any) {
    const response = await api.get('/citizens', { params });
    return response.data;
  },

  async getById(id: string) {
    const response = await api.get(`/citizens/${id}`);
    return response.data;
  },

  async create(data: any) {
    const response = await api.post('/citizens', data);
    return response.data;
  },

  async update(id: string, data: any) {
    const response = await api.patch(`/citizens/${id}`, data);
    return response.data;
  },

  async delete(id: string) {
    const response = await api.delete(`/citizens/${id}`);
    return response.data;
  },

  async getStatistics(params?: any) {
    const response = await api.get('/citizens/statistics', { params });
    return response.data;
  },

  async getFamilies() {
    const response = await api.get('/citizens/families');
    return response.data;
  },

  async exportExcel(params?: any) {
    const response = await api.get('/citizens/export', {
      params,
      responseType: 'blob',
    });
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().toISOString().split('T')[0];
    link.download = `data-warga-${timestamp}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  async importExcel(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/citizens/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async uploadDocument(citizenId: string, file: File, type: string) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/citizens/${citizenId}/${type}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // ============ MY PROFILE (Warga self-service) ============

  async getMyProfile() {
    const response = await api.get('/citizens/my-profile');
    return response.data;
  },

  async updateMyProfile(data: {
    noTelp?: string;
    email?: string;
    alamat?: string;
    npwp?: string;
    noBpjsKesehatan?: string;
    noBpjsKetenagakerjaan?: string;
  }) {
    const response = await api.patch('/citizens/my-profile', data);
    return response.data;
  },

  async uploadMyPhoto(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/citizens/my-profile/upload-photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async uploadMyDocument(type: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/citizens/my-profile/${type}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
