import { apiClient } from './client';
import { RankTier } from '../game/ranking';
import { GuildRole } from './guilds';

export interface PlayerSummary {
  id: number;
  username: string;
  mmr: number;
  online: boolean;
}

export interface FriendRequest {
  requestId: number;
  user: PlayerSummary;
  createdAt: string;
}

export interface FriendsOverview {
  friends: PlayerSummary[];
  /** Requests waiting for my answer. */
  incoming: FriendRequest[];
  /** Requests I sent that are still pending. */
  outgoing: FriendRequest[];
}

export type Relation = 'self' | 'none' | 'friend' | 'incoming' | 'outgoing' | 'blocked' | 'blocked_by';

export interface PlayerSearchResult extends PlayerSummary {
  relation: Relation;
}

export interface PublicProfile {
  id: number;
  username: string;
  mmr: number;
  rank: RankTier;
  xp: number;
  level: number;
  since: string;
  online: boolean;
  stats: { wins: number; losses: number; total: number; winRate: number };
  guild: { id: number; name: string; tag: string; role: GuildRole } | null;
  relation: Relation;
}

export const REPORT_REASONS = ['cheating', 'harassment', 'offensive_name', 'spam', 'other'] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const getFriends = async (): Promise<FriendsOverview> => {
  const { data } = await apiClient.get<FriendsOverview>('/friends');
  return data;
};

/** Sends a request — or accepts the other player's pending one. */
export const sendFriendRequest = async (
  username: string,
): Promise<{ status: 'pending' | 'accepted'; message: string }> => {
  const { data } = await apiClient.post('/friends/request', { username });
  return data;
};

export const acceptFriendRequest = async (requestId: number): Promise<void> => {
  await apiClient.post(`/friends/requests/${requestId}/accept`);
};

/** Declines an incoming request or cancels an outgoing one. */
export const deleteFriendRequest = async (requestId: number): Promise<void> => {
  await apiClient.delete(`/friends/requests/${requestId}`);
};

export const removeFriend = async (userId: number): Promise<void> => {
  await apiClient.delete(`/friends/${userId}`);
};

export const getBlocked = async (): Promise<{ id: number; username: string }[]> => {
  const { data } = await apiClient.get<{ blocked: { id: number; username: string }[] }>('/friends/blocked');
  return data.blocked;
};

export const blockUser = async (userId: number): Promise<void> => {
  await apiClient.post(`/friends/block/${userId}`);
};

export const unblockUser = async (userId: number): Promise<void> => {
  await apiClient.delete(`/friends/block/${userId}`);
};

export const searchPlayers = async (q: string): Promise<PlayerSearchResult[]> => {
  const { data } = await apiClient.get<{ players: PlayerSearchResult[] }>('/users/search', { params: { q } });
  return data.players;
};

export const getPublicProfile = async (userId: number): Promise<PublicProfile> => {
  const { data } = await apiClient.get<{ profile: PublicProfile }>(`/users/${userId}/profile`);
  return data.profile;
};

export const reportPlayer = async (input: {
  targetId: number;
  reason: ReportReason;
  details?: string;
}): Promise<void> => {
  await apiClient.post('/reports', input);
};
