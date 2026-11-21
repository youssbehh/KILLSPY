import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { useGameStore } from '../stores/gameStore';
import { useChallengeStore } from '../stores/challengeStore';
import { FRIENDS_KEY } from '../hooks/useFriends';
import { INBOX_KEY, dmKey } from '../hooks/useMessages';
import { GUILD_CHAT_KEY } from '../hooks/useGuilds';
import { disconnectSocket, ensureSocket, getSocket, peekSocket } from './client';
import { ServerToClientEvents } from './events';

/**
 * The one place where server pushes are turned into app state.
 *
 * Mounted once at the root for the whole session, it keeps the socket open and feeds:
 * - the game store (matchmaking, turns, results, reconnection),
 * - the challenge store (friend duels),
 * - the react-query cache (new messages, friend and guild changes).
 *
 * Because it lives above every screen, a match can start or resume while the
 * player is anywhere in the app (accepted challenge, connection coming back).
 */
export const useRealtime = () => {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  // Changes when another account logs in on this device: reopen the socket for it.
  const userId = useAuthStore((s) => s.user?.id ?? null);

  useEffect(() => {
    if (!isAuthenticated || userId === null) return;
    const game = () => useGameStore.getState();
    const challenges = () => useChallengeStore.getState();

    const handlers: ServerToClientEvents = {
      'matchmaking:status': ({ status, queueSize }) => {
        if (status === 'searching') game().setSearching(game().mode, queueSize);
      },
      'match:found': ({ roomId, opponent, countdownMs, mode }) => {
        challenges()._reset();
        game().setMatchFound(roomId, opponent, countdownMs, mode);
      },
      'match:resume': (payload) => game().setResumed(payload),
      'turn:start': ({ round, deadlineAt }) => {
        // deadlineAt is a server clock value; re-anchor it on the local clock so a
        // skewed device clock cannot shorten or lengthen the visible countdown.
        game().setTurnStart(round, Date.now() + Math.max(0, deadlineAt - Date.now()));
      },
      'state:update': ({ state }) => game().setStateUpdate(state),
      'game:over': ({ outcome, finalState, rewards, mode }) => {
        game().setOutcome(outcome, finalState, rewards, mode);
      },
      'opponent:status': ({ connected, graceMs }) => game().setOpponentStatus(connected, graceMs),
      'challenge:received': ({ from, expiresInMs }) => challenges()._received(from, expiresInMs),
      'challenge:closed': (payload) => challenges()._closed(payload),
      'dm:new': ({ fromId }) => {
        queryClient.invalidateQueries({ queryKey: INBOX_KEY });
        queryClient.invalidateQueries({ queryKey: dmKey(fromId) });
      },
      'guild:message': () => {
        queryClient.invalidateQueries({ queryKey: GUILD_CHAT_KEY });
      },
      'social:update': ({ kind }) => {
        if (kind === 'friends') {
          queryClient.invalidateQueries({ queryKey: FRIENDS_KEY });
          queryClient.invalidateQueries({ queryKey: ['players'] });
        } else {
          queryClient.invalidateQueries({ queryKey: ['guilds'] });
        }
      },
      'error:message': (msg) => game().setError(msg),
    };

    // socket.io reconnects by itself; the server then sends match:resume if a match is waiting.
    const onDisconnect = () => game().setConnected(false);
    const onConnect = () => {
      game().setConnected(true);
      // Presence changed while we were away.
      queryClient.invalidateQueries({ queryKey: FRIENDS_KEY });
    };

    const events = Object.keys(handlers) as (keyof ServerToClientEvents)[];

    // Listen first, connect second: nothing the server pushes on connection is missed.
    const socket = ensureSocket();
    events.forEach((e) => socket.on(e, handlers[e] as never));
    socket.on('disconnect', onDisconnect);
    socket.on('connect', onConnect);

    getSocket()
      .catch(() => {
        // Server unreachable: REST screens show their own errors; the duel screen retries on demand.
      });

    return () => {
      const current = peekSocket();
      if (current) {
        events.forEach((e) => current.off(e, handlers[e] as never));
        current.off('disconnect', onDisconnect);
        current.off('connect', onConnect);
      }
      // Session ended or changed: the next one opens its own connection.
      disconnectSocket();
      challenges()._reset();
    };
  }, [isAuthenticated, userId, queryClient]);
};
