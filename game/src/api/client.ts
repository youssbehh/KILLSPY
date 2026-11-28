import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getRefreshToken, getToken, saveTokens, SessionTokens } from '../stores/authStore';

const baseURL = process.env.EXPO_PUBLIC_API_URL;

if (!baseURL) {
  console.warn('EXPO_PUBLIC_API_URL is not set. API requests will fail.');
}

export const apiClient = axios.create({
  baseURL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Called when the session cannot be renewed. Registered by lib/session.ts —
 * injected rather than imported, since the session module depends on this client.
 */
let onUnauthorized: (() => Promise<void>) | null = null;
export const setUnauthorizedHandler = (handler: () => Promise<void>) => {
  onUnauthorized = handler;
};

/** The session cannot be renewed any more (used by the socket layer too). */
export const sessionLost = async () => {
  await onUnauthorized?.();
};

export type RefreshResult = 'renewed' | 'rejected' | 'unreachable';

let inFlight: Promise<RefreshResult> | null = null;

/**
 * Trades the stored refresh token for a new pair.
 * - 'renewed': new tokens stored, retry what failed;
 * - 'rejected': the server refused (expired, revoked): the session is over;
 * - 'unreachable': network trouble, the session is kept and may be retried later.
 * Concurrent callers (several requests + the socket) share a single call.
 */
export const refreshSession = (): Promise<RefreshResult> => {
  if (inFlight) return inFlight;
  inFlight = (async (): Promise<RefreshResult> => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return 'rejected';
    try {
      // Bare axios call: it must not go through the interceptors below.
      const { data } = await axios.post<SessionTokens>(`${baseURL}/auth/refresh`, { refreshToken }, { timeout: 10000 });
      await saveTokens(data);
      return 'renewed';
    } catch (e) {
      const status = axios.isAxiosError(e) ? e.response?.status : undefined;
      return status === 401 || status === 400 ? 'rejected' : 'unreachable';
    }
  })().finally(() => {
    inFlight = null;
  });
  return inFlight;
};

apiClient.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string; errorCode?: number }>) => {
    const config = error.config as RetriableConfig | undefined;
    // A 401 on the auth endpoints themselves (wrong password) is a normal form error.
    const isAuthCall = config?.url?.startsWith('/auth/') ?? false;
    if (error.response?.status !== 401 || isAuthCall || !config) {
      return Promise.reject(error);
    }

    // The access token expired: renew it once, then replay the request.
    if (!config._retried) {
      const result = await refreshSession();
      if (result === 'renewed') {
        config._retried = true;
        return apiClient(config);
      }
      if (result === 'unreachable') return Promise.reject(error);
    }

    await onUnauthorized?.();
    return Promise.reject(error);
  },
);

export type ApiError = {
  message: string;
  errorCode?: number;
};

export const extractApiError = (e: unknown): ApiError => {
  if (axios.isAxiosError(e)) {
    const data = e.response?.data as { message?: string; errorCode?: number } | undefined;
    return {
      message: data?.message ?? e.message ?? 'Erreur réseau',
      errorCode: data?.errorCode,
    };
  }
  return { message: e instanceof Error ? e.message : 'Erreur inconnue' };
};
