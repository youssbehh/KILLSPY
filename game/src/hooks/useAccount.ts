import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as accountApi from '../api/account';
import { saveTokens, useAuthStore } from '../stores/authStore';
import { reconnectSocket } from '../sockets/client';

/** Step 1 of "forgot password": the server e-mails a code (and never says whether the address exists). */
export const useRequestPasswordReset = () => useMutation({ mutationFn: accountApi.requestPasswordReset });

/** Step 2: e-mail + code + new password. The user then logs in normally. */
export const useResetPassword = () => useMutation({ mutationFn: accountApi.resetPassword });

/** Signs out the other devices; this one keeps going with the new token. */
export const useChangePassword = () =>
  useMutation({
    mutationFn: accountApi.changePassword,
    onSuccess: async (tokens) => {
      await saveTokens(tokens);
      // The socket was authenticated with the old token: reopen it with the new one.
      reconnectSocket();
    },
  });

export const useSendVerificationEmail = () => useMutation({ mutationFn: accountApi.sendVerificationEmail });

export const useVerifyEmail = () => {
  const updateUser = useAuthStore((s) => s.updateUser);
  return useMutation({
    mutationFn: accountApi.verifyEmail,
    onSuccess: () => {
      updateUser({ emailVerified: true, verificationRequired: false });
      // Ranked play is checked when the socket connects.
      reconnectSocket();
    },
  });
};

/** Guest → account. Replaces the session (new token, same player id). */
export const useUpgradeGuest = () => {
  const qc = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: accountApi.upgradeGuest,
    onSuccess: async ({ user, ...tokens }) => {
      await setSession(user, tokens);
      // Same player id, new rights (no longer a guest): the socket must reconnect.
      reconnectSocket();
      // Queries that were disabled for guests can now run.
      qc.invalidateQueries();
    },
  });
};
