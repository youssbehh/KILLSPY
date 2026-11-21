import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as guildsApi from '../api/guilds';
import { GuildDTO, GuildListPage, GuildMessageDTO, GuildMessagePage, GUILD_PAGE_SIZE } from '../api/guilds';
import { useAuthStore } from '../stores/authStore';

export const MY_GUILD_KEY = ['guilds', 'me'];
const LIST_KEY = ['guilds', 'list'];
export const GUILD_CHAT_KEY = ['guilds', 'chat'];
export const GUILD_INVITES_KEY = ['guilds', 'invites'];

const useIsAccount = () => {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  const isGuest = useAuthStore((s) => s.user?.guest ?? false);
  return isAuth && !isGuest;
};

/** My guild with its members, or null. Kept fresh by the `social:update` socket event. */
export const useMyGuild = () => {
  const enabled = useIsAccount();
  return useQuery({ queryKey: MY_GUILD_KEY, queryFn: guildsApi.getMyGuild, enabled });
};

/** Guild directory, page by page. `guilds` is the flattened list. */
export const useGuildList = (search?: string) => {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  const query = useInfiniteQuery({
    queryKey: [...LIST_KEY, search ?? ''],
    queryFn: ({ pageParam }: { pageParam: number }) => guildsApi.listGuilds(search, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage: GuildListPage, allPages: GuildListPage[]) =>
      lastPage.hasMore ? allPages.length * GUILD_PAGE_SIZE : undefined,
    enabled: isAuth,
    staleTime: 30_000,
  });
  const pages: GuildListPage[] = query.data?.pages ?? [];
  const guilds: GuildDTO[] = pages.flatMap((p) => p.guilds);
  return { ...query, guilds, createCost: pages[0]?.createCost ?? 5000 };
};

/** Anything that changes my membership or my guild's roster. */
const useGuildMutation = <TArgs, TResult>(mutationFn: (args: TArgs) => Promise<TResult>) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['guilds'] });
      qc.invalidateQueries({ queryKey: ['players'] });
    },
  });
};

export const useCreateGuild = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: guildsApi.createGuild,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['guilds'] });
      // Creation is paid: refresh the wallet from the server rather than guessing the price.
      qc.invalidateQueries({ queryKey: ['users', 'me'] });
    },
  });
};

export const useJoinGuild = () => useGuildMutation(guildsApi.joinGuild);
export const useLeaveGuild = () => useGuildMutation(guildsApi.leaveGuild);
export const useKickMember = () => useGuildMutation(guildsApi.kickMember);
export const useUpdateGuild = () => useGuildMutation(guildsApi.updateGuild);
export const useDissolveGuild = () => useGuildMutation(guildsApi.dissolveGuild);
export const useTransferLeadership = () => useGuildMutation(guildsApi.transferLeadership);
export const useSetMemberRole = () =>
  useGuildMutation(({ userId, role }: { userId: number; role: 'OFFICER' | 'MEMBER' }) =>
    guildsApi.setMemberRole(userId, role),
  );

// ── Chat ────────────────────────────────────────────────────────────────────

/**
 * Guild chat, loaded page by page going back in time. `messages` is oldest → newest.
 * New messages arrive through the `guild:message` socket event (see useRealtime).
 */
export const useGuildChat = (enabled: boolean) => {
  const query = useInfiniteQuery({
    queryKey: GUILD_CHAT_KEY,
    queryFn: ({ pageParam }: { pageParam: number | undefined }) => guildsApi.getGuildMessages(pageParam),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage: GuildMessagePage) => (lastPage.hasMore ? lastPage.messages[0]?.id : undefined),
    enabled,
    refetchInterval: 60_000,
  });
  const pages: GuildMessagePage[] = query.data?.pages ?? [];
  const messages: GuildMessageDTO[] = [...pages].reverse().flatMap((p) => p.messages);
  return { ...query, messages };
};

export const usePostGuildMessage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: guildsApi.postGuildMessage,
    onSuccess: () => qc.invalidateQueries({ queryKey: GUILD_CHAT_KEY }),
  });
};

// ── Invitations ─────────────────────────────────────────────────────────────

/** Invitations I received (only meaningful while I have no guild). */
export const useMyGuildInvites = () => {
  const enabled = useIsAccount();
  return useQuery({ queryKey: GUILD_INVITES_KEY, queryFn: guildsApi.getMyInvites, enabled });
};

export const useInvitePlayer = () => useMutation({ mutationFn: guildsApi.invitePlayer });
export const useAcceptInvite = () => useGuildMutation(guildsApi.acceptInvite);
export const useDeclineInvite = () => useGuildMutation(guildsApi.declineInvite);
