import { queryClient } from './queryClient';
import { disconnectSocket } from '../sockets/client';
import { useAuthStore } from '../stores/authStore';
import { useGameStore } from '../stores/gameStore';
import { setUnauthorizedHandler } from '../api/client';

/**
 * Single exit door for a session (logout, expired token, deleted account):
 * closes the socket, drops every cached server response of the previous user,
 * resets the match state and clears the stored credentials.
 * The root layout's auth guard then redirects to the login screen.
 */
export const endSession = async (): Promise<void> => {
  disconnectSocket();
  useGameStore.getState().reset();
  await useAuthStore.getState().clearSession();
  queryClient.clear();
};

setUnauthorizedHandler(endSession);
