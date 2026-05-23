import { apiClient } from './client';

export interface FriendRecord {
  ID_Friendship: number;
  ID_User: number;
  ID_Friend: number;
  Connected: boolean;
  Blocked: boolean;
  Friend: { ID_User: number; Username: string; MMR?: number };
}

export const addFriend = async (Username: string): Promise<void> => {
  await apiClient.post('/friends/add', { Username });
};

export const getFriends = async (): Promise<FriendRecord[]> => {
  const { data } = await apiClient.get<{ record: FriendRecord[] }>('/friends/getByUser');
  return data.record;
};

export const getBlockedFriends = async (): Promise<FriendRecord[]> => {
  const { data } = await apiClient.get<{ record: FriendRecord[] }>('/friends/getBlockedFriends');
  return data.record;
};
