/**
 * Strongly-typed event names exchanged with the API socket server.
 * Must stay identical to api/src/sockets/events.ts (minus GameState import path).
 */

import { GameAction, GameState } from '../game/gameEngine';

export interface PublicPlayer {
  id: number;
  username: string;
}

export interface MatchFoundPayload {
  roomId: string;
  opponent: PublicPlayer;
  countdownMs: number;
  turnMs: number;
}

export interface TurnStartPayload {
  round: number;
  deadlineAt: number;
}

export interface StateUpdatePayload {
  state: GameState;
}

export interface GameOverPayload {
  outcome: 'won' | 'lost' | 'draw' | 'opponent_forfeit';
  finalState: GameState;
}

export interface MatchmakingStatusPayload {
  status: 'searching' | 'cancelled';
  queueSize: number;
}

export interface ClientToServerEvents {
  'matchmaking:join': () => void;
  'matchmaking:leave': () => void;
  'game:action': (action: GameAction) => void;
  'game:leave': () => void;
}

export interface ServerToClientEvents {
  'matchmaking:status': (payload: MatchmakingStatusPayload) => void;
  'match:found': (payload: MatchFoundPayload) => void;
  'turn:start': (payload: TurnStartPayload) => void;
  'state:update': (payload: StateUpdatePayload) => void;
  'game:over': (payload: GameOverPayload) => void;
  'error:message': (message: string) => void;
}
