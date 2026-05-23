import { useEffect, useRef } from 'react';
import { useGameStore } from '../stores/gameStore';
import { getSocket, disconnectSocket, GameSocket } from './client';

/**
 * Hook that wires the multiplayer socket events to the game store.
 * Returns helpers to start/cancel a search and submit actions.
 */
export const useMatchmaking = () => {
  const socketRef = useRef<GameSocket | null>(null);
  const {
    setSearching,
    setMatchFound,
    setTurnStart,
    setStateUpdate,
    setOutcome,
    setError,
    reset,
  } = useGameStore();

  useEffect(() => {
    let cancelled = false;

    getSocket()
      .then((s) => {
        if (cancelled) return;
        socketRef.current = s;

        s.on('matchmaking:status', ({ status }) => {
          if (status === 'searching') setSearching();
        });

        s.on('match:found', ({ roomId, opponent, countdownMs }) => {
          setMatchFound(roomId, opponent, countdownMs);
        });

        s.on('turn:start', ({ round, deadlineAt }) => {
          setTurnStart(round, deadlineAt);
        });

        s.on('state:update', ({ state }) => {
          setStateUpdate(state);
        });

        s.on('game:over', ({ outcome, finalState }) => {
          setOutcome(outcome, finalState);
        });

        s.on('error:message', (msg) => {
          setError(msg);
        });
      })
      .catch((e) => setError(e?.message ?? 'Connexion socket impossible.'));

    return () => {
      cancelled = true;
      const s = socketRef.current;
      if (s) {
        s.off('matchmaking:status');
        s.off('match:found');
        s.off('turn:start');
        s.off('state:update');
        s.off('game:over');
        s.off('error:message');
      }
    };
  }, []);

  const joinQueue = () => socketRef.current?.emit('matchmaking:join');
  const leaveQueue = () => socketRef.current?.emit('matchmaking:leave');
  const sendAction = (action: 'shield' | 'shoot' | 'reload') =>
    socketRef.current?.emit('game:action', action);
  const leaveGame = () => {
    socketRef.current?.emit('game:leave');
    reset();
  };

  return { joinQueue, leaveQueue, sendAction, leaveGame };
};

export { disconnectSocket };
