import { apiClient } from './client';

export interface MessageDTO {
  id: number;
  senderId: number;
  senderUsername: string;
  content: string;
  sentAt: string;
  readAt: string | null;
}

export interface ConversationSummary {
  friendId: number;
  friendUsername: string;
  lastMessage: string | null;
  lastAt: string | null;
  unreadCount: number;
}

export interface MessagePage {
  /** Oldest → newest. */
  messages: MessageDTO[];
  /** True when older messages exist before this page. */
  hasMore: boolean;
}

export const getInbox = async (): Promise<ConversationSummary[]> => {
  const { data } = await apiClient.get<{ inbox: ConversationSummary[] }>('/messages/inbox');
  return data.inbox;
};

/** `before` = id of the oldest message already loaded; omit for the latest page. */
export const getConversation = async (userId: number, before?: number): Promise<MessagePage> => {
  const { data } = await apiClient.get<MessagePage>(`/messages/dm/${userId}`, {
    params: before ? { before } : {},
  });
  return data;
};

export const sendMessage = async (userId: number, content: string): Promise<MessageDTO> => {
  const { data } = await apiClient.post<{ message: MessageDTO }>(`/messages/dm/${userId}`, { content });
  return data.message;
};
