import { useMutation } from '@tanstack/react-query';
import * as authApi from '../api/auth';
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

export const useLogoutMutation = () => {
  const { user, clearSession } = useAuthStore.getState();
  return useMutation({
    mutationFn: async () => {
      if (user) await authApi.logout(user.id);
    },
    onSettled: () => clearSession(),
  });
};
