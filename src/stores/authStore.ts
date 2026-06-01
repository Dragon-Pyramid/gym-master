import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { login } from '@/services/apiClient';
import {
  getSessionFromCookie,
  getToken,
  loginSession,
  logoutSession,
} from '@/services/storageService';
import { jwtDecode } from 'jwt-decode';

import type { Usuario } from '@/interfaces/usuario.interface';

type StoreUser = Partial<Usuario> & {
  id?: string;
  email?: string;
  rol?: string;
  permisos_menu?: string[] | null;
  must_change_password?: boolean;
};

interface AuthState {
  user: StoreUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  login: (credentials: {
    email: string;
    password: string;
    rol: string;
  }) => Promise<{ success: boolean; mustChangePassword?: boolean }>;
  logout: () => void;
  initializeAuth: () => void;
  updateUser: (patch: Partial<StoreUser>) => void;
  refreshSession: (token: string) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      isInitialized: false,
      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const result = await login(credentials);
          if (result.ok && result.token) {
            const decoded = jwtDecode<StoreUser>(result.token);
            loginSession(result.token);
            set({
              user: decoded,
              token: result.token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              isInitialized: true,
            });
            return { success: true, mustChangePassword: Boolean(decoded.must_change_password) };
          } else {
            set({
              error: result.message || 'Error de autenticación',
              isLoading: false,
            });
            return { success: false };
          }
        } catch {
          set({
            error: 'Error de conexión',
            isLoading: false,
          });
          return { success: false };
        }
      },
      logout: () => {
        logoutSession();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
          isInitialized: true,
        });
      },
      initializeAuth: () => {
        if (get().isInitialized) return;
        const token = getToken();
        const session = getSessionFromCookie();
        if (token && session) {
          set({
            user: session as StoreUser,
            token,
            isAuthenticated: true,
            isInitialized: true,
          });
        } else {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isInitialized: true,
          });
        }
      },
      updateUser: (patch) => {
        const currentUser = get().user;
        set({
          user: currentUser ? { ...currentUser, ...patch } : currentUser,
        });
      },
      refreshSession: (token) => {
        const decoded = jwtDecode<StoreUser>(token);
        loginSession(token);
        set({
          user: decoded,
          token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
          isInitialized: true,
        });
      },
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
