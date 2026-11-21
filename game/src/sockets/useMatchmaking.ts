import { useCallback } from 'react';
import { useGameStore } from '../stores/gameStore';
import { getSocket, peekSocket } from './client';
import { GameAction } from '../game/gameEngine';
import { QueueMode } from './events';

/**
 * Actions of the duel screen: search, cancel, play, leave.
 * Incoming events are handled globally by useRealtime, which fills the game store.
 */
export const useMatchmaking = () => {
  const joinQueue = useCallback(async (mode: QueueMode = 'pvp_quick') => {
    const { setSearching, setError } = useGameStore.getState();
    setSearching(mode);
    try {
      const socket = await getSocket();
      socket.emit('matchmaking:join', mode);
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
    const socket = peekSocket();
    socket?.emit('matchmaking:leave');
    socket?.emit('game:leave');
    useGameStore.getState().reset();
  }, []);

  return { joinQueue, leaveQueue, sendAction, leaveGame };
};
