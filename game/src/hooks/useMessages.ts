import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as messagesApi from '../api/messages';
import { MessageDTO, MessagePage } from '../api/messages';
import { useAuthStore } from '../stores/authStore';

export const INBOX_KEY = ['messages', 'inbox'];
export const dmKey = (userId: number) => ['messages', 'dm', userId];

/**
 * Conversations with unread counts.
 * New messages arrive through the `dm:new` socket event (see useRealtime); the slow
 * refetch below is only a safety net for a socket that silently dropped.
 */
export const useInbox = () => {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  const isGuest = useAuthStore((s) => s.user?.guest ?? false);
  return useQuery({
    queryKey: INBOX_KEY,
    queryFn: messagesApi.getInbox,
    enabled: isAuth && !isGuest,
    refetchInterval: 60_000,
  });
};

/**
 * A conversation, loaded page by page going back in time.
 * `messages` is flattened oldest → newest; call `fetchNextPage()` to load older ones
 * while `hasNextPage` is true.
 */
export const useConversation = (partnerId: number | null) => {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  const query = useInfiniteQuery({
    queryKey: dmKey(partnerId ?? 0),
    queryFn: ({ pageParam }: { pageParam: number | undefined }) =>
      messagesApi.getConversation(partnerId!, pageParam),
    initialPageParam: undefined as number | undefined,
    // The "next" page is the older one: its cursor is the oldest message we hold.
    getNextPageParam: (lastPage: MessagePage) => (lastPage.hasMore ? lastPage.messages[0]?.id : undefined),
    enabled: isAuth && partnerId !== null,
    refetchInterval: 60_000,
  });

  const pages: MessagePage[] = query.data?.pages ?? [];
  const messages: MessageDTO[] = [...pages].reverse().flatMap((p) => p.messages);
  return { ...query, messages };
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
