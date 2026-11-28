import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureStorage, REFRESH_TOKEN_KEY, TOKEN_KEY } from '../lib/secureStorage';

/** Short-lived access token + the refresh token that renews it. */
export interface SessionTokens {
  token: string;
  refreshToken: string;
}

export interface AuthUser {
  id: number;
  username: string;
  email?: string;
  mmr: number;
  money: number;
  xp: number;
  level: number;
  emailVerified: boolean;
  /** Set by the server: ranked, shop, messages and guilds stay locked until the e-mail is verified. */
  verificationRequired?: boolean;
  guest: boolean;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  setSession: (user: AuthUser, tokens: SessionTokens) => Promise<void>;
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
      setSession: async (user, tokens) => {
        await saveTokens(tokens);
        set({ user, isAuthenticated: true });
      },
      updateUser: (patch) => set((s) => (s.user ? { user: { ...s.user, ...patch } } : s)),
      clearSession: async () => {
        await Promise.all([secureStorage.removeItem(TOKEN_KEY), secureStorage.removeItem(REFRESH_TOKEN_KEY)]);
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
export const getRefreshToken = () => secureStorage.getItem(REFRESH_TOKEN_KEY);

/** Stores a new pair (login, refresh, password change). Credentials never go through the persisted state. */
export const saveTokens = async ({ token, refreshToken }: SessionTokens) => {
  await Promise.all([
    secureStorage.setItem(TOKEN_KEY, token),
    secureStorage.setItem(REFRESH_TOKEN_KEY, refreshToken),
  ]);
};
