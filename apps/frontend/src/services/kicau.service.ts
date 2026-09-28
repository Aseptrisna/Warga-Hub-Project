import api from './api';

export interface KicauPost {
  id: string;
  authorUserId: string;
  authorName: string;
  authorRole: string;
  isi: string;
  fotoUrls: string[];
  desa: string;
  rw?: string;
  rt?: string;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  createdAt: string;
}

export interface KicauComment {
  id: string;
  postId: string;
  authorUserId: string;
  authorName: string;
  isi: string;
  createdAt: string;
}

export interface Paginated<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export const kicauService = {
  async getFeed(params?: { page?: number; limit?: number }): Promise<Paginated<KicauPost>> {
    const response = await api.get('/kicau', { params });
    return response.data;
  },

  async create(isi: string, fotos: File[]): Promise<{ data: KicauPost }> {
    const formData = new FormData();
    if (isi) formData.append('isi', isi);
    fotos.forEach((f) => formData.append('fotos', f));
    const response = await api.post('/kicau', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async toggleLike(id: string): Promise<{ liked: boolean; likeCount: number }> {
    const response = await api.post(`/kicau/${id}/like`);
    return response.data;
  },

  async getComments(id: string, params?: { page?: number; limit?: number }): Promise<Paginated<KicauComment>> {
    const response = await api.get(`/kicau/${id}/comments`, { params });
    return response.data;
  },

  async addComment(id: string, isi: string): Promise<{ data: KicauComment }> {
    const response = await api.post(`/kicau/${id}/comments`, { isi });
    return response.data;
  },

  async deletePost(id: string) {
    const response = await api.delete(`/kicau/${id}`);
    return response.data;
  },

  async deleteComment(commentId: string) {
    const response = await api.delete(`/kicau/comments/${commentId}`);
    return response.data;
  },

  async hidePost(id: string, reason: string) {
    const response = await api.patch(`/kicau/${id}/hide`, { reason });
    return response.data;
  },
};
