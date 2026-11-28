/**
 * Strongly-typed event names exchanged between client and server.
 * Must stay identical to api/src/sockets/events.ts.
 */

import { GameAction, GameState } from '../game/gameEngine';

/** pvp_friendly = duel between friends started by a challenge: no reward, no history. */
export type PvpMode = 'pvp_quick' | 'pvp_ranked' | 'pvp_friendly';
/** Modes that have a public matchmaking queue. */
export type QueueMode = Exclude<PvpMode, 'pvp_friendly'>;

export interface PublicPlayer {
  id: number;
  username: string;
  /** Combat effects the player has equipped (names, see game/cosmeticFx.ts). */
  fx?: { shoot: string | null; shield: string | null };
}

export interface MatchFoundPayload {
  roomId: string;
  mode: PvpMode;
  opponent: PublicPlayer;
  countdownMs: number;
  turnMs: number;
}

/** Sent to a player whose connection came back while their match was still running. */
export interface MatchResumePayload {
  roomId: string;
  mode: PvpMode;
  opponent: PublicPlayer;
  state: GameState;
  /** Milliseconds left in the current turn, or null between two turns. */
  turnRemainingMs: number | null;
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
  xpDelta: number;
}

export interface GameOverPayload {
  outcome: 'won' | 'lost' | 'draw' | 'opponent_forfeit';
  finalState: GameState;
  mode: PvpMode;
  /** What the server credited for this match (0 for guests, friendly and cancelled matches). */
  rewards: MatchRewards;
}

export interface MatchmakingStatusPayload {
  status: 'searching' | 'cancelled';
  queueSize: number;
}

export interface OpponentStatusPayload {
  connected: boolean;
  /** When disconnected: how long the opponent has to come back before forfeiting. */
  graceMs?: number;
}

export interface ChallengeReceivedPayload {
  from: PublicPlayer;
  expiresInMs: number;
}

export interface ChallengeClosedPayload {
  /** The other player of the challenge. */
  userId: number;
  reason: 'declined' | 'expired' | 'cancelled' | 'unavailable';
}

export interface DirectMessagePayload {
  fromId: number;
  message: { id: number; senderId: number; senderUsername: string; content: string; sentAt: string; readAt: string | null };
}

export interface GuildMessagePayload {
  message: { id: number; senderId: number; senderUsername: string; content: string; sentAt: string };
}

/** "Something changed, refetch": friends list / requests, or guild membership / invites. */
export interface SocialUpdatePayload {
  kind: 'friends' | 'guild';
}

export interface ClientToServerEvents {
  'matchmaking:join': (mode?: QueueMode) => void;
  'matchmaking:leave': () => void;
  'game:action': (action: GameAction) => void;
  'game:leave': () => void;
  'challenge:send': (friendId: number) => void;
  'challenge:accept': (fromId: number) => void;
  'challenge:decline': (fromId: number) => void;
  'challenge:cancel': (friendId: number) => void;
}

export interface ServerToClientEvents {
  'matchmaking:status': (payload: MatchmakingStatusPayload) => void;
  'match:found': (payload: MatchFoundPayload) => void;
  'match:resume': (payload: MatchResumePayload) => void;
  'turn:start': (payload: TurnStartPayload) => void;
  'state:update': (payload: StateUpdatePayload) => void;
  'game:over': (payload: GameOverPayload) => void;
  'opponent:status': (payload: OpponentStatusPayload) => void;
  'challenge:received': (payload: ChallengeReceivedPayload) => void;
  'challenge:closed': (payload: ChallengeClosedPayload) => void;
  'dm:new': (payload: DirectMessagePayload) => void;
  'guild:message': (payload: GuildMessagePayload) => void;
  'social:update': (payload: SocialUpdatePayload) => void;
  'error:message': (message: string) => void;
}
