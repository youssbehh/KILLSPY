import { apiClient } from './client';
import { AuthUser } from '../stores/authStore';

export const getMe = async (): Promise<AuthUser> => {
  const { data } = await apiClient.get<AuthUser>('/users/me');
  return data;
};

export const updateUsername = async (newUsername: string): Promise<{ id: number; username: string }> => {
  const { data } = await apiClient.post<{ user: { id: number; username: string } }>(
    '/users/update-username',
    { newUsername },
  );
  return data.user;
};

export const deleteAccount = async (userId: number): Promise<void> => {
  await apiClient.put(`/users/deleteUser/${userId}`);
};
