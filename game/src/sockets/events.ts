/**
 * Strongly-typed event names exchanged with the API socket server.
 * Must stay identical to api/src/sockets/events.ts (minus GameState import path).
 */

import { GameAction, GameState } from '../game/gameEngine';

export type PvpMode = 'pvp_quick' | 'pvp_ranked';

export interface PublicPlayer {
  id: number;
  username: string;
}

export interface MatchFoundPayload {
  roomId: string;
  mode: PvpMode;
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

export interface MatchRewards {
  mmrDelta: number;
  moneyDelta: number;
}

export interface GameOverPayload {
  outcome: 'won' | 'lost' | 'draw' | 'opponent_forfeit';
  finalState: GameState;
  mode: PvpMode;
  /** What the server credited for this match (0 for guests and cancelled matches). */
  rewards: MatchRewards;
}

export interface MatchmakingStatusPayload {
  status: 'searching' | 'cancelled';
  queueSize: number;
}

export interface ClientToServerEvents {
  'matchmaking:join': (mode?: PvpMode) => void;
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
