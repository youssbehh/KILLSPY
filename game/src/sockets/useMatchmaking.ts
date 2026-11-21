import { useCallback, useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';
import { getSocket, peekSocket, disconnectSocket } from './client';
import { GameAction } from '../game/gameEngine';
import { PvpMode, ServerToClientEvents } from './events';

/**
 * Hook that wires the multiplayer socket events to the game store.
 * Returns helpers to start/cancel a search and submit actions.
 *
 * Mount it once per match screen: listeners are registered with their own
 * references, so unmounting only removes what this instance added.
 */
export const useMatchmaking = () => {
  useEffect(() => {
    let cancelled = false;
    const store = () => useGameStore.getState();

    const handlers: ServerToClientEvents = {
      'matchmaking:status': ({ status, queueSize }) => {
        if (status === 'searching') store().setSearching(store().mode, queueSize);
      },
      'match:found': ({ roomId, opponent, countdownMs, mode }) => {
        store().setMatchFound(roomId, opponent, countdownMs, mode);
      },
      'turn:start': ({ round, deadlineAt }) => {
        // deadlineAt is a server clock value; re-anchor it on the local clock so a
        // skewed device clock cannot shorten or lengthen the visible countdown.
        store().setTurnStart(round, Date.now() + Math.max(0, deadlineAt - Date.now()));
      },
      'state:update': ({ state }) => store().setStateUpdate(state),
      'game:over': ({ outcome, finalState, rewards, mode }) => {
        store().setOutcome(outcome, finalState, rewards, mode);
      },
      'error:message': (msg) => store().setError(msg),
    };

    const onDisconnect = () => {
      const { matchStatus } = store();
      if (matchStatus !== 'idle' && matchStatus !== 'finished') {
        store().setError('Connexion au serveur perdue.');
      }
    };

    const events = Object.keys(handlers) as (keyof ServerToClientEvents)[];

    getSocket()
      .then((s) => {
        if (cancelled) return;
        events.forEach((e) => s.on(e, handlers[e] as never));
        s.on('disconnect', onDisconnect);
      })
      .catch((e) => store().setError(e?.message ?? 'Connexion au serveur impossible.'));

    return () => {
      cancelled = true;
      const s = peekSocket();
      if (!s) return;
      events.forEach((e) => s.off(e, handlers[e] as never));
      s.off('disconnect', onDisconnect);
    };
  }, []);

  const joinQueue = useCallback(async (mode: PvpMode = 'pvp_quick') => {
    const { setSearching, setError } = useGameStore.getState();
    setSearching(mode);
    try {
      const s = await getSocket();
      s.emit('matchmaking:join', mode);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connexion au serveur impossible.');
    }
  }, []);

  const leaveQueue = useCallback(() => {
    peekSocket()?.emit('matchmaking:leave');
  }, []);

  const sendAction = useCallback((action: GameAction) => {
    peekSocket()?.emit('game:action', action);
  }, []);

  /** Leaves the queue and/or forfeits the match in progress, then clears local state. */
  const leaveGame = useCallback(() => {
    const s = peekSocket();
    s?.emit('matchmaking:leave');
    s?.emit('game:leave');
    useGameStore.getState().reset();
  }, []);

  return { joinQueue, leaveQueue, sendAction, leaveGame };
};

export { disconnectSocket };
