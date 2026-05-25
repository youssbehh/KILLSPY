import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as messagesApi from '../api/messages';
import { useAuthStore } from '../stores/authStore';

const INBOX_KEY = ['messages', 'inbox'];
const dmKey = (userId: number) => ['messages', 'dm', userId];

export const useInbox = () => {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  const isGuest = useAuthStore((s) => s.user?.guest ?? false);
  return useQuery({
    queryKey: INBOX_KEY,
    queryFn: messagesApi.getInbox,
    enabled: isAuth && !isGuest,
    refetchInterval: 10_000, // poll every 10s
  });
};

export const useConversation = (partnerId: number | null) => {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: dmKey(partnerId ?? 0),
    queryFn: () => messagesApi.getConversation(partnerId!),
    enabled: isAuth && partnerId !== null,
    refetchInterval: 5_000, // poll every 5s for near-real-time feel
  });
};

export const useSendMessage = (partnerId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => messagesApi.sendMessage(partnerId, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dmKey(partnerId) });
      qc.invalidateQueries({ queryKey: INBOX_KEY });
    },
  });
};
