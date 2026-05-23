import axios, { AxiosError } from 'axios';
import { getToken, useAuthStore } from '../stores/authStore';

const baseURL = process.env.EXPO_PUBLIC_API_URL;

if (!baseURL) {
  console.warn('EXPO_PUBLIC_API_URL is not set. API requests will fail.');
}

export const apiClient = axios.create({
  baseURL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = token;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string; errorCode?: number }>) => {
    if (error.response?.status === 401) {
      await useAuthStore.getState().clearSession();
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
