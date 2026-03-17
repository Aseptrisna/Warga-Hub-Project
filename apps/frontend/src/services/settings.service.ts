import api from './api';

export const settingsService = {
  async getAll(category?: string) {
    const response = await api.get('/settings', { params: { category } });
    return response.data;
  },

  async bulkUpdate(updates: { key: string; value: string }[]) {
    const response = await api.patch('/settings', { updates });
    return response.data;
  },
};

export interface UserStatistics {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  byRole: { role: string; count: number }[];
  byDesa: { desa: string; count: number }[];
}

export const usersService = {
  async getAll(params?: any) {
    const response = await api.get('/users', { params });
    return response.data;
  },

  async getById(id: string) {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  async create(data: {
    email: string;
    password: string;
    name: string;
    role: string;
    desa: string;
    phone?: string;
    rw?: string;
    rt?: string;
  }) {
    const response = await api.post('/users', data);
    return response.data;
  },

  async update(id: string, data: any) {
    const response = await api.patch(`/users/${id}`, data);
    return response.data;
  },

  async changeRole(id: string, role: string) {
    const response = await api.patch(`/users/${id}/role`, { role });
    return response.data;
  },

  async toggleActive(id: string) {
    const response = await api.patch(`/users/${id}/toggle-active`);
    return response.data;
  },

  async delete(id: string) {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  async getStatistics(): Promise<UserStatistics> {
    const response = await api.get('/users/statistics');
    return response.data;
  },
};

export const profileService = {
  async changePassword(currentPassword: string, newPassword: string) {
    const response = await api.patch('/auth/change-password', { currentPassword, newPassword });
    return response.data;
  },

  async updateProfile(data: { name?: string; phone?: string }) {
    const response = await api.patch('/auth/update-profile', data);
    return response.data;
  },
};
