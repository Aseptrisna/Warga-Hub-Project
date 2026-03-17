import api from './api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nik: string;
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface ValidateNikRequest {
  nik: string;
}

export interface ValidateNikResponse {
  valid: boolean;
  nama?: string;
  desa?: string;
  rw?: string;
  rt?: string;
  message?: string;
}

export interface RegisterDesaRequest {
  name: string;
  email: string;
  phone?: string;
  password: string;
  desaName: string;
  kecamatan?: string;
  kabupaten?: string;
  provinsi?: string;
  address?: string;
  postalCode?: string;
  desaPhone?: string;
  desaEmail?: string;
  leaderName?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export const authService = {
  async validateNik(data: ValidateNikRequest): Promise<ValidateNikResponse> {
    const response = await api.post('/auth/validate-nik', data);
    return response.data;
  },

  async login(data: LoginRequest) {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  async register(data: RegisterRequest) {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  async registerDesa(data: RegisterDesaRequest) {
    const response = await api.post('/auth/register-desa', data);
    return response.data;
  },

  async verifyEmail(token: string) {
    const response = await api.post('/auth/verify-email', { token });
    return response.data;
  },

  async resendVerification(email: string) {
    const response = await api.post('/auth/resend-verification', { email });
    return response.data;
  },

  async forgotPassword(data: ForgotPasswordRequest) {
    const response = await api.post('/auth/forgot-password', data);
    return response.data;
  },

  async resetPassword(data: ResetPasswordRequest) {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  },

  async refreshToken(refreshToken: string) {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  },

  async getProfile() {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  async logout() {
    const response = await api.post('/auth/logout');
    return response.data;
  },
};
