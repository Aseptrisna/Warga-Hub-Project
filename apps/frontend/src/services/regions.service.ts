import api from './api';

export enum RegionType {
  PROVINSI = 'Provinsi',
  KABUPATEN = 'Kabupaten',
  KECAMATAN = 'Kecamatan',
  DESA = 'Desa',
  RW = 'RW',
  RT = 'RT',
}

export interface Region {
  id: string;
  name: string;
  type: RegionType;
  parentId?: string;
  code?: string;
  provinsi?: string;
  kabupaten?: string;
  kecamatan?: string;
  desa?: string;
  rw?: string;
  rt?: string;
  phone?: string;
  email?: string;
  address?: string;
  postalCode?: string;
  leaderName?: string;
  leaderPhone?: string;
  totalCitizens?: number;
  totalFamilies?: number;
  logoUrl?: string;
  bannerUrl?: string;
  subdomain?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRegionDto {
  name: string;
  type: RegionType;
  parentId?: string;
  code?: string;
  provinsi?: string;
  kabupaten?: string;
  kecamatan?: string;
  desa?: string;
  rw?: string;
  rt?: string;
  phone?: string;
  email?: string;
  address?: string;
  postalCode?: string;
  leaderName?: string;
  leaderPhone?: string;
  subdomain?: string;
  description?: string;
  isActive?: boolean;
}

export interface LandingConfig {
  heroTitle?: string;
  heroSubtitle?: string;
  aboutText?: string;
  features?: string[];
  contactPhone?: string;
  contactEmail?: string;
  socialMedia?: Record<string, string>;
}

// Public endpoints (no auth required) - used on registration page
export const publicRegionsService = {
  async getDesa() {
    const { data } = await api.get('/public/regions/desa');
    return data;
  },

  async getChildren(id: string) {
    const { data } = await api.get(`/public/regions/${id}/children`);
    return data;
  },

  async getDesaLanding(subdomain: string) {
    const { data } = await api.get(`/public/regions/landing/${subdomain}`);
    return data;
  },
};

export const regionsService = {
  async getAll(params?: {
    type?: RegionType;
    parentId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { data } = await api.get('/regions', { params });
    return data;
  },

  async getOne(id: string) {
    const { data } = await api.get(`/regions/${id}`);
    return data;
  },

  async getTree(regionId?: string) {
    const { data } = await api.get('/regions/tree', {
      params: { regionId },
    });
    return data;
  },

  async getMyTree() {
    const { data } = await api.get('/regions/my-tree');
    return data;
  },

  async getBreadcrumb(id: string) {
    const { data } = await api.get(`/regions/${id}/breadcrumb`);
    return data;
  },

  async getChildren(id: string, type?: RegionType) {
    const { data } = await api.get(`/regions/${id}/children`, {
      params: { type },
    });
    return data;
  },

  async create(dto: CreateRegionDto) {
    const { data } = await api.post('/regions', dto);
    return data;
  },

  async update(id: string, dto: Partial<CreateRegionDto>) {
    const { data } = await api.patch(`/regions/${id}`, dto);
    return data;
  },

  async delete(id: string) {
    const { data } = await api.delete(`/regions/${id}`);
    return data;
  },

  // AdminDesa: My Desa endpoints
  async getMyDesa() {
    const { data } = await api.get('/regions/my-desa');
    return data;
  },

  async updateMyDesa(dto: Partial<CreateRegionDto>) {
    const { data } = await api.patch('/regions/my-desa', dto);
    return data;
  },

  async updateMyDesaLanding(config: LandingConfig) {
    const { data } = await api.patch('/regions/my-desa/landing', config);
    return data;
  },

  async uploadDesaLogo(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post('/regions/my-desa/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async uploadDesaBanner(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post('/regions/my-desa/banner', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};
