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
  /** false = invitation only. */
  isOpen: boolean;
  memberCount: number;
  maxMembers: number;
  createdAt: string;
  myRole: GuildRole | null;
  members?: GuildMemberDTO[];
}

export type MyGuild = GuildDTO & { members: GuildMemberDTO[] };

export interface GuildListPage {
  guilds: GuildDTO[];
  hasMore: boolean;
  createCost: number;
}

export interface GuildMessageDTO {
  id: number;
  senderId: number;
  senderUsername: string;
  content: string;
  sentAt: string;
}

export interface GuildMessagePage {
  /** Oldest → newest. */
  messages: GuildMessageDTO[];
  hasMore: boolean;
}

export interface GuildInviteDTO {
  id: number;
  guild: { id: number; name: string; tag: string; memberCount: number; maxMembers: number };
  invitedBy: string;
  createdAt: string;
}

export const GUILD_PAGE_SIZE = 20;

export const listGuilds = async (search?: string, offset = 0): Promise<GuildListPage> => {
  const { data } = await apiClient.get<GuildListPage>('/guilds', {
    params: { ...(search ? { search } : {}), offset, limit: GUILD_PAGE_SIZE },
  });
  return data;
};

export const getMyGuild = async (): Promise<MyGuild | null> => {
  const { data } = await apiClient.get<{ guild: MyGuild | null }>('/guilds/me');
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

/** Officers and the leader. The leader cannot be kicked. */
export const kickMember = async (userId: number): Promise<void> => {
  await apiClient.delete(`/guilds/kick/${userId}`);
};

// ── Leader only ─────────────────────────────────────────────────────────────

export const updateGuild = async (patch: {
  name?: string;
  description?: string | null;
  isOpen?: boolean;
}): Promise<MyGuild> => {
  const { data } = await apiClient.patch<{ guild: MyGuild }>('/guilds/me', patch);
  return data.guild;
};

export const setMemberRole = async (userId: number, role: 'OFFICER' | 'MEMBER'): Promise<MyGuild> => {
  const { data } = await apiClient.post<{ guild: MyGuild }>(`/guilds/members/${userId}/role`, { role });
  return data.guild;
};

/** The current leader becomes an officer. */
export const transferLeadership = async (userId: number): Promise<MyGuild> => {
  const { data } = await apiClient.post<{ guild: MyGuild }>(`/guilds/members/${userId}/transfer`);
  return data.guild;
};

export const dissolveGuild = async (): Promise<void> => {
  await apiClient.delete('/guilds/me/dissolve');
};

// ── Chat ────────────────────────────────────────────────────────────────────

/** `before` = id of the oldest message already loaded; omit for the latest page. */
export const getGuildMessages = async (before?: number): Promise<GuildMessagePage> => {
  const { data } = await apiClient.get<GuildMessagePage>('/guilds/me/messages', {
    params: before ? { before } : {},
  });
  return data;
};

export const postGuildMessage = async (content: string): Promise<GuildMessageDTO> => {
  const { data } = await apiClient.post<{ message: GuildMessageDTO }>('/guilds/me/messages', { content });
  return data.message;
};

// ── Invitations ─────────────────────────────────────────────────────────────

/** Invitations I received. */
export const getMyInvites = async (): Promise<GuildInviteDTO[]> => {
  const { data } = await apiClient.get<{ invites: GuildInviteDTO[] }>('/guilds/invites');
  return data.invites;
};

/** Officers and the leader. */
export const invitePlayer = async (username: string): Promise<{ message: string }> => {
  const { data } = await apiClient.post<{ message: string }>('/guilds/invites', { username });
  return data;
};

export const acceptInvite = async (inviteId: number): Promise<MyGuild> => {
  const { data } = await apiClient.post<{ guild: MyGuild }>(`/guilds/invites/${inviteId}/accept`);
  return data.guild;
};

export const declineInvite = async (inviteId: number): Promise<void> => {
  await apiClient.delete(`/guilds/invites/${inviteId}`);
};
