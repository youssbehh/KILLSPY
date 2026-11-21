import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as friendsApi from '../api/friends';
import { useAuthStore } from '../stores/authStore';

export const FRIENDS_KEY = ['friends'];
const BLOCKED_KEY = ['friends', 'blocked'];
const profileKey = (userId: number) => ['players', 'profile', userId];

const useIsAccount = () => {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  const isGuest = useAuthStore((s) => s.user?.guest ?? false);
  return isAuth && !isGuest;
};

/** Friends + incoming + outgoing requests. Kept fresh by the `social:update` socket event. */
export const useFriends = () => {
  const enabled = useIsAccount();
  return useQuery({ queryKey: FRIENDS_KEY, queryFn: friendsApi.getFriends, enabled });
};

/** Every social mutation changes relations: refresh lists, search results and profiles. */
const useSocialMutation = <TArgs, TResult>(mutationFn: (args: TArgs) => Promise<TResult>) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FRIENDS_KEY });
      qc.invalidateQueries({ queryKey: ['players'] });
      qc.invalidateQueries({ queryKey: ['messages', 'inbox'] });
    },
  });
};

export const useSendFriendRequest = () => useSocialMutation(friendsApi.sendFriendRequest);
export const useAcceptFriendRequest = () => useSocialMutation(friendsApi.acceptFriendRequest);
export const useDeleteFriendRequest = () => useSocialMutation(friendsApi.deleteFriendRequest);
export const useRemoveFriend = () => useSocialMutation(friendsApi.removeFriend);
export const useBlockUser = () => useSocialMutation(friendsApi.blockUser);
export const useUnblockUser = () => useSocialMutation(friendsApi.unblockUser);

export const useBlocked = () => {
  const enabled = useIsAccount();
  return useQuery({ queryKey: BLOCKED_KEY, queryFn: friendsApi.getBlocked, enabled });
};

/** Search runs from 2 characters on. */
export const usePlayerSearch = (query: string) => {
  const enabled = useIsAccount();
  const q = query.trim();
  return useQuery({
    queryKey: ['players', 'search', q],
    queryFn: () => friendsApi.searchPlayers(q),
    enabled: enabled && q.length >= 2,
    staleTime: 15_000,
  });
};

export const usePublicProfile = (userId: number | null) => {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: profileKey(userId ?? 0),
    queryFn: () => friendsApi.getPublicProfile(userId!),
    enabled: isAuth && userId !== null,
  });
};

export const useReportPlayer = () => useMutation({ mutationFn: friendsApi.reportPlayer });
