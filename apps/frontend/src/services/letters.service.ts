import api from './api';

export interface LetterTemplate {
  id: string;
  name: string;
  code: string;
  title: string;
  description: string;
  requiredFields: string[];
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Letter {
  id: string;
  letterNumber: string;
  templateId: string;
  templateName: string;
  templateCode: string;
  requestedBy: string;
  requestedByName: string;
  citizenId: string;
  regionId?: string;
  status: string;
  data: Record<string, any>;
  metadata?: Record<string, any>;

  // RT Approval
  approvedByRT?: string;
  approvedByRTName?: string;
  approvedAtRT?: string;
  rtNotes?: string;

  // RW Approval
  approvedByRW?: string;
  approvedByRWName?: string;
  approvedAtRW?: string;
  rwNotes?: string;

  // Desa Approval
  approvedByDesa?: string;
  approvedByDesaName?: string;
  approvedAtDesa?: string;
  desaNotes?: string;

  // Rejection
  rejectedBy?: string;
  rejectedByName?: string;
  rejectedAt?: string;
  rejectionReason?: string;

  // PDF
  pdfUrl?: string;
  qrCode?: string;
  generatedAt?: string;

  createdAt: string;
  updatedAt: string;
}

export interface CreateLetterTemplateDto {
  name: string;
  code: string;
  title: string;
  description: string;
  requiredFields: string[];
  content: string;
  isActive?: boolean;
}

export interface CreateLetterDto {
  templateId: string;
  citizenId: string;
  regionId?: string;
  data: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface ApproveLetterDto {
  notes?: string;
}

export interface RejectLetterDto {
  reason: string;
}

// Letter Templates API
export const letterTemplatesService = {
  async getAll(params?: { search?: string; isActive?: boolean; page?: number; limit?: number }) {
    const response = await api.get<{ data: LetterTemplate[]; meta: any }>('/letter-templates', { params });
    return response.data;
  },

  async getById(id: string) {
    const response = await api.get<LetterTemplate>(`/letter-templates/${id}`);
    return response.data;
  },

  async create(data: CreateLetterTemplateDto) {
    const response = await api.post<LetterTemplate>('/letter-templates', data);
    return response.data;
  },

  async update(id: string, data: Partial<CreateLetterTemplateDto>) {
    const response = await api.patch<LetterTemplate>(`/letter-templates/${id}`, data);
    return response.data;
  },

  async delete(id: string) {
    await api.delete(`/letter-templates/${id}`);
  },

  async toggleActive(id: string) {
    const response = await api.patch<LetterTemplate>(`/letter-templates/${id}/toggle-active`);
    return response.data;
  },
};

// Letters API
export const lettersService = {
  async getAll(params?: {
    status?: string;
    templateId?: string;
    requestedBy?: string;
    regionId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await api.get<{ data: Letter[]; meta: any }>('/letters', { params });
    return response.data;
  },

  async getMy(params?: { status?: string; page?: number; limit?: number }) {
    const response = await api.get<{ data: Letter[]; meta: any }>('/letters/my', { params });
    return response.data;
  },

  async getById(id: string) {
    const response = await api.get<Letter>(`/letters/${id}`);
    return response.data;
  },

  async create(data: CreateLetterDto) {
    const response = await api.post<Letter>('/letters', data);
    return response.data;
  },

  async approveByRT(id: string, data: ApproveLetterDto) {
    const response = await api.patch<Letter>(`/letters/${id}/approve-rt`, data);
    return response.data;
  },

  async approveByRW(id: string, data: ApproveLetterDto) {
    const response = await api.patch<Letter>(`/letters/${id}/approve-rw`, data);
    return response.data;
  },

  async approveByDesa(id: string, data: ApproveLetterDto) {
    const response = await api.patch<Letter>(`/letters/${id}/approve-desa`, data);
    return response.data;
  },

  async reject(id: string, data: RejectLetterDto) {
    const response = await api.patch<Letter>(`/letters/${id}/reject`, data);
    return response.data;
  },

  async regeneratePDF(id: string) {
    const response = await api.post<Letter>(`/letters/${id}/regenerate-pdf`);
    return response.data;
  },

  async delete(id: string) {
    await api.delete(`/letters/${id}`);
  },
};
