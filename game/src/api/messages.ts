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

export const getInbox = async (): Promise<ConversationSummary[]> => {
  const { data } = await apiClient.get<{ inbox: ConversationSummary[] }>('/messages/inbox');
  return data.inbox;
};

export const getConversation = async (userId: number): Promise<MessageDTO[]> => {
  const { data } = await apiClient.get<{ messages: MessageDTO[] }>(`/messages/dm/${userId}`);
  return data.messages;
};

export const sendMessage = async (userId: number, content: string): Promise<MessageDTO> => {
  const { data } = await apiClient.post<{ message: MessageDTO }>(`/messages/dm/${userId}`, { content });
  return data.message;
};
