import axios, { AxiosError } from 'axios';
import { getToken } from '../stores/authStore';

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
 * Called when the API rejects the stored session. Registered by lib/session.ts —
 * injected rather than imported, since the session module depends on this client.
 */
let onUnauthorized: (() => Promise<void>) | null = null;
export const setUnauthorizedHandler = (handler: () => Promise<void>) => {
  onUnauthorized = handler;
};

apiClient.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string; errorCode?: number }>) => {
    // An expired/invalid session ends here. A 401 on the auth endpoints themselves
    // (wrong password) is a normal form error and must not touch the session.
    const isAuthCall = error.config?.url?.startsWith('/auth/') ?? false;
    if (error.response?.status === 401 && !isAuthCall) {
      await onUnauthorized?.();
    }
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
