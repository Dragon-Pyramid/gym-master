import { create } from "zustand";
import { persist } from "zustand/middleware";
import { login } from "@/services/apiClient";
import {
  loginSession,
  logoutSession,
  getSessionFromCookie,
  getToken,
} from "@/services/storageService";
import { jwtDecode } from "jwt-decode";

interface User {
  id: string;
  email: string;
  rol: string;
  dbName: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  login: (credentials: {
    email: string;
    password: string;
    rol: string;
    dbName: string;
  }) => Promise<boolean>;
  logout: () => void;
  initializeAuth: () => void;
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
            const decoded = jwtDecode(result.token) as User;

            loginSession(result.token);

            set({
              user: decoded,
              token: result.token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              isInitialized: true,
            });

            return true;
          } else {
            set({
              error: result.message || "Error de autenticación",
              isLoading: false,
            });
            return false;
          }
        } catch {
          set({
            error: "Error de conexión",
            isLoading: false,
          });
          return false;
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
            user: session as User,
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

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
