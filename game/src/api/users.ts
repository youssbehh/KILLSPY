import { apiClient } from './client';

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
