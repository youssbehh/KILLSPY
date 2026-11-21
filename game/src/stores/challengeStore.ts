import { create } from 'zustand';
import { ChallengeClosedPayload, PublicPlayer } from '../sockets/events';
import { getSocket, peekSocket } from '../sockets/client';

/**
 * Friend duels ("challenges").
 *
 * - `sendChallenge(friend)` asks a friend for a duel; `outgoing` is set while waiting.
 * - `incoming` is the challenge another player sent me (shown by ChallengeOverlay).
 * - When a challenge is accepted the server starts a friendly match: the game store
 *   switches to 'countdown' and the app navigates to the duel screen by itself.
 * - `lastClosed` tells why the last challenge ended (declined, expired, unavailable…).
 */
interface ChallengeState {
  incoming: { from: PublicPlayer; expiresAt: number } | null;
  outgoing: { to: PublicPlayer; expiresAt: number } | null;
  lastClosed: (ChallengeClosedPayload & { username?: string }) | null;

  sendChallenge: (friend: PublicPlayer) => Promise<void>;
  cancelChallenge: () => void;
  acceptIncoming: () => void;
  declineIncoming: () => void;
  clearClosed: () => void;

  // Called by the realtime layer only.
  _received: (from: PublicPlayer, expiresInMs: number) => void;
  _closed: (payload: ChallengeClosedPayload) => void;
  _reset: () => void;
}

export const CHALLENGE_TTL_MS = 30_000;

export const useChallengeStore = create<ChallengeState>((set, get) => ({
  incoming: null,
  outgoing: null,
  lastClosed: null,

  sendChallenge: async (friend) => {
    const socket = await getSocket();
    set({ outgoing: { to: friend, expiresAt: Date.now() + CHALLENGE_TTL_MS }, lastClosed: null });
    socket.emit('challenge:send', friend.id);
  },

  cancelChallenge: () => {
    const { outgoing } = get();
    if (!outgoing) return;
    peekSocket()?.emit('challenge:cancel', outgoing.to.id);
    set({ outgoing: null });
  },

  acceptIncoming: () => {
    const { incoming } = get();
    if (!incoming) return;
    peekSocket()?.emit('challenge:accept', incoming.from.id);
    set({ incoming: null });
  },

  declineIncoming: () => {
    const { incoming } = get();
    if (!incoming) return;
    peekSocket()?.emit('challenge:decline', incoming.from.id);
    set({ incoming: null });
  },

  clearClosed: () => set({ lastClosed: null }),

  _received: (from, expiresInMs) => set({ incoming: { from, expiresAt: Date.now() + expiresInMs } }),

  _closed: (payload) => {
    const { incoming, outgoing } = get();
    if (outgoing?.to.id === payload.userId) {
      set({ outgoing: null, lastClosed: { ...payload, username: outgoing.to.username } });
    } else if (incoming?.from.id === payload.userId) {
      set({ incoming: null, lastClosed: { ...payload, username: incoming.from.username } });
    }
  },

  _reset: () => set({ incoming: null, outgoing: null, lastClosed: null }),
}));
