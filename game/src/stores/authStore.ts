import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureStorage, TOKEN_KEY } from '../lib/secureStorage';

export interface AuthUser {
  id: number;
  username: string;
  email?: string;
  mmr: number;
  money: number;
  guest: boolean;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  setSession: (user: AuthUser, token: string) => Promise<void>;
  updateUser: (patch: Partial<AuthUser>) => void;
  clearSession: () => Promise<void>;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      hydrated: false,
      setSession: async (user, token) => {
        await secureStorage.setItem(TOKEN_KEY, token);
        set({ user, isAuthenticated: true });
      },
      updateUser: (patch) => set((s) => (s.user ? { user: { ...s.user, ...patch } } : s)),
      clearSession: async () => {
        await secureStorage.removeItem(TOKEN_KEY);
        set({ user: null, isAuthenticated: false });
      },
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'killspy.auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);

export const getToken = () => secureStorage.getItem(TOKEN_KEY);
