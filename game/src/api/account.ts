import { apiClient } from './client';
import { AuthResponse } from './auth';

/** Always succeeds, whether or not the address is known (the server never tells). */
export const requestPasswordReset = async (email: string): Promise<void> => {
  await apiClient.post('/auth/password/forgot', { email });
};

export const resetPassword = async (input: { email: string; code: string; password: string }): Promise<void> => {
  await apiClient.post('/auth/password/reset', input);
};

/** Other devices are signed out; this one continues with the returned token. */
export const changePassword = async (input: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ token: string }> => {
  const { data } = await apiClient.post<{ token: string }>('/users/change-password', input);
  return data;
};

export const sendVerificationEmail = async (): Promise<void> => {
  await apiClient.post('/users/email/send');
};

export const verifyEmail = async (code: string): Promise<void> => {
  await apiClient.post('/users/email/verify', { code });
};

/** Turns the current guest into a full account (same id, progress kept). */
export const upgradeGuest = async (input: {
  username: string;
  email: string;
  passwordCrea: string;
}): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>('/users/upgrade-guest', input);
  return data;
};
