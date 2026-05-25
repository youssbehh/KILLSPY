import { useMutation, useQuery } from '@tanstack/react-query';
import * as authApi from '../api/auth';
import * as usersApi from '../api/users';
import { useAuthStore } from '../stores/authStore';

export const useLoginMutation = () => {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: ({ user, token }) => setSession(user, token),
  });
};

export const useGuestMutation = () => {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: authApi.loginGuest,
    onSuccess: ({ user, token }) => setSession(user, token),
  });
};

export const useSignupMutation = () =>
  useMutation({ mutationFn: authApi.signup });

/** Fetches fresh mmr + money from the API and patches the auth store.
 *  Call once from the root layout — runs every time the app comes to foreground. */
export const useSyncMe = () => {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  const isGuest = useAuthStore((s) => s.user?.guest ?? false);
  const updateUser = useAuthStore((s) => s.updateUser);
  return useQuery({
    queryKey: ['users', 'me'],
    queryFn: async () => {
      const me = await usersApi.getMe();
      updateUser({ mmr: me.mmr, money: me.money, username: me.username });
      return me;
    },
    enabled: isAuth && !isGuest,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
};

export const useLogoutMutation = () => {
  const { user, clearSession } = useAuthStore.getState();
  return useMutation({
    mutationFn: async () => {
      if (user) await authApi.logout(user.id);
    },
    onSettled: () => clearSession(),
  });
};
