import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Role } from '@shared/role.enum';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  desa?: string;
  rw?: string;
  rt?: string;
  phone?: string;
  citizenId?: string;
  nik?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string, refreshToken: string) => void;
  logout: () => void;
  setTokens: (token: string, refreshToken: string) => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,

      login: (user, token, refreshToken) => {
        set({
          user,
          token,
          refreshToken,
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      setTokens: (token, refreshToken) => {
        set({ token, refreshToken });
      },

      setUser: (user) => {
        set({ user });
      },
    }),
    {
      name: 'wargahub-auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
