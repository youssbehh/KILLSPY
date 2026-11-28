import { apiClient } from './client';
import { AuthUser, SessionTokens } from '../stores/authStore';

export interface AuthResponse extends SessionTokens {
  user: AuthUser;
}

/** `acceptTerms`: the player accepted the privacy notice (the server refuses without it). */
export const signup = async (input: {
  username: string;
  email: string;
  passwordCrea: string;
  acceptTerms: true;
}): Promise<AuthUser> => {
  const { data } = await apiClient.post<{ user: AuthUser }>('/auth/signup', input);
  return data.user;
};

export const login = async (input: { identifier: string; password: string }): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', input);
  return data;
};

/** Only called once the player accepted the privacy notice. */
export const loginGuest = async (): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>('/auth/guest', { acceptTerms: true });
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
