import api from './api';

export const customRolesService = {
  async getAll() {
    const response = await api.get('/custom-roles');
    return response.data;
  },

  async getOne(code: string) {
    const response = await api.get(`/custom-roles/${code}`);
    return response.data;
  },

  async create(data: { code: string; label: string; description?: string; baseRoles: string[]; menuPaths: string[] }) {
    const response = await api.post('/custom-roles', data);
    return response.data;
  },

  async update(code: string, data: Partial<{ label: string; description: string; baseRoles: string[]; menuPaths: string[]; isActive: boolean }>) {
    const response = await api.patch(`/custom-roles/${code}`, data);
    return response.data;
  },

  async delete(code: string) {
    const response = await api.delete(`/custom-roles/${code}`);
    return response.data;
  },

  async getMyMenu() {
    const response = await api.get('/custom-roles/my-menu');
    return response.data;
  },
};
