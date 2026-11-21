import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as accountApi from '../api/account';
import { useAuthStore } from '../stores/authStore';
import { secureStorage, TOKEN_KEY } from '../lib/secureStorage';
import { disconnectSocket } from '../sockets/client';

/** Step 1 of "forgot password": the server e-mails a code (and never says whether the address exists). */
export const useRequestPasswordReset = () => useMutation({ mutationFn: accountApi.requestPasswordReset });

/** Step 2: e-mail + code + new password. The user then logs in normally. */
export const useResetPassword = () => useMutation({ mutationFn: accountApi.resetPassword });

/** Signs out the other devices; this one keeps going with the new token. */
export const useChangePassword = () =>
  useMutation({
    mutationFn: accountApi.changePassword,
    onSuccess: async ({ token }) => {
      await secureStorage.setItem(TOKEN_KEY, token);
      // The socket was authenticated with the old token: reopen it with the new one.
      disconnectSocket();
    },
  });

export const useSendVerificationEmail = () => useMutation({ mutationFn: accountApi.sendVerificationEmail });

export const useVerifyEmail = () => {
  const updateUser = useAuthStore((s) => s.updateUser);
  return useMutation({
    mutationFn: accountApi.verifyEmail,
    onSuccess: () => updateUser({ emailVerified: true }),
  });
};

/** Guest → account. Replaces the session (new token, same player id). */
export const useUpgradeGuest = () => {
  const qc = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: accountApi.upgradeGuest,
    onSuccess: async ({ user, token }) => {
      disconnectSocket();
      await setSession(user, token);
      // Queries that were disabled for guests can now run.
      qc.invalidateQueries();
    },
  });
};
