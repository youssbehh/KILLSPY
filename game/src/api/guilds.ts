import { apiClient } from './client';

export type GuildRole = 'LEADER' | 'OFFICER' | 'MEMBER';

export interface GuildMemberDTO {
  userId: number;
  username: string;
  mmr: number;
  role: GuildRole;
  joinedAt: string;
}

export interface GuildDTO {
  id: number;
  name: string;
  tag: string;
  description: string | null;
  isOpen: boolean;
  memberCount: number;
  maxMembers: number;
  createdAt: string;
  myRole: GuildRole | null;
  members?: GuildMemberDTO[];
}

export const listGuilds = async (search?: string): Promise<{ guilds: GuildDTO[]; createCost: number }> => {
  const { data } = await apiClient.get<{ guilds: GuildDTO[]; createCost: number }>(
    '/guilds', { params: search ? { search } : {} }
  );
  return data;
};

export const getMyGuild = async (): Promise<GuildDTO & { members: GuildMemberDTO[] } | null> => {
  const { data } = await apiClient.get<{ guild: (GuildDTO & { members: GuildMemberDTO[] }) | null }>('/guilds/me');
  return data.guild;
};

export const createGuild = async (input: { name: string; tag: string; description?: string }): Promise<GuildDTO> => {
  const { data } = await apiClient.post<{ guild: GuildDTO }>('/guilds', input);
  return data.guild!;
};

export const joinGuild = async (guildId: number): Promise<GuildDTO> => {
  const { data } = await apiClient.post<{ guild: GuildDTO }>(`/guilds/${guildId}/join`);
  return data.guild!;
};

export const leaveGuild = async (): Promise<void> => {
  await apiClient.delete('/guilds/me');
};

export const kickMember = async (userId: number): Promise<void> => {
  await apiClient.delete(`/guilds/kick/${userId}`);
};
