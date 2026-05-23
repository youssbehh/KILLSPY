import { apiClient } from './client';
import { AuthUser } from '../stores/authStore';

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export const signup = async (input: { username: string; email: string; passwordCrea: string }): Promise<AuthUser> => {
  const { data } = await apiClient.post<{ user: AuthUser }>('/auth/signup', input);
  return data.user;
};

export const login = async (input: { identifier: string; password: string }): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', input);
  return data;
};

export const loginGuest = async (): Promise<AuthResponse> => {
  const { data } = await apiClient.get<AuthResponse>('/auth/guest');
  return data;
};

export const logout = async (userId: number): Promise<void> => {
  await apiClient.post(`/auth/logout/${userId}`);
};

export const ping = async (): Promise<boolean> => {
  try {
    const { status } = await apiClient.get('/ping/getPing');
    return status === 200;
  } catch {
    return false;
  }
};
