import api from './api';

export const UMKM_KATEGORI = ['Kuliner', 'Kerajinan', 'Fashion', 'Pertanian', 'Jasa', 'Lainnya'] as const;

export type UmkmStatus = 'Menunggu' | 'Disetujui' | 'Ditolak';

export interface Umkm {
  id: string;
  nama: string;
  kategori: string;
  deskripsi: string;
  alamat: string;
  noWhatsapp: string;
  fotoUrl?: string;
  ownerUserId: string;
  ownerName: string;
  desa: string;
  rw?: string;
  rt?: string;
  status: UmkmStatus;
  rejectionReason?: string;
  createdAt: string;
}

export interface UmkmInput {
  nama: string;
  kategori: string;
  deskripsi: string;
  alamat: string;
  noWhatsapp: string;
}

export const umkmService = {
  async getAll(params?: { page?: number; limit?: number; kategori?: string; status?: string; search?: string }) {
    const response = await api.get('/umkm', { params });
    return response.data as { data: Umkm[]; meta: { total: number; page: number; totalPages: number } };
  },

  async getMine() {
    const response = await api.get('/umkm/my');
    return response.data as { data: Umkm[] };
  },

  async getPublic(desa: string, params?: { page?: number; limit?: number; kategori?: string }) {
    const response = await api.get('/umkm/public', { params: { desa, ...params } });
    return response.data as { data: Umkm[]; meta: { total: number; page: number; totalPages: number } };
  },

  async create(data: UmkmInput) {
    const response = await api.post('/umkm', data);
    return response.data as { message: string; data: Umkm };
  },

  async update(id: string, data: Partial<UmkmInput>) {
    const response = await api.patch(`/umkm/${id}`, data);
    return response.data;
  },

  async uploadFoto(id: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/umkm/${id}/foto`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async review(id: string, data: { status: 'Disetujui' | 'Ditolak'; rejectionReason?: string }) {
    const response = await api.patch(`/umkm/${id}/review`, data);
    return response.data;
  },

  async delete(id: string) {
    const response = await api.delete(`/umkm/${id}`);
    return response.data;
  },
};

/** 08xx / +628xx / 628xx → 628xx, for wa.me links. */
export function toWaNumber(raw: string) {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  return digits;
}
