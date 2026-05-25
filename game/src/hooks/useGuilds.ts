import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as guildsApi from '../api/guilds';
import { useAuthStore } from '../stores/authStore';

const MY_KEY = ['guilds', 'me'];
const LIST_KEY = ['guilds', 'list'];

export const useMyGuild = () => {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  const isGuest = useAuthStore((s) => s.user?.guest ?? false);
  return useQuery({ queryKey: MY_KEY, queryFn: guildsApi.getMyGuild, enabled: isAuth && !isGuest });
};

export const useGuildList = (search?: string) => {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: [...LIST_KEY, search],
    queryFn: () => guildsApi.listGuilds(search),
    enabled: isAuth,
    staleTime: 30_000,
  });
};

export const useCreateGuild = () => {
  const qc = useQueryClient();
  const updateUser = useAuthStore((s) => s.updateUser);
  return useMutation({
    mutationFn: guildsApi.createGuild,
    onSuccess: (guild) => {
      // Deduct cost from local store so UI updates immediately
      const user = useAuthStore.getState().user;
      if (user) updateUser({ money: user.money - 5000 });
      qc.invalidateQueries({ queryKey: MY_KEY });
      qc.invalidateQueries({ queryKey: LIST_KEY });
    },
  });
};

export const useJoinGuild = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: guildsApi.joinGuild,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MY_KEY });
      qc.invalidateQueries({ queryKey: LIST_KEY });
    },
  });
};

export const useLeaveGuild = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: guildsApi.leaveGuild,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MY_KEY });
      qc.invalidateQueries({ queryKey: LIST_KEY });
    },
  });
};

export const useKickMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: guildsApi.kickMember,
    onSuccess: () => qc.invalidateQueries({ queryKey: MY_KEY }),
  });
};
