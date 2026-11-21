import { create } from 'zustand';
import { GameAction, GameState, createInitialState } from '../game/gameEngine';
import { MatchRewards, MatchResumePayload, PublicPlayer, PvpMode } from '../sockets/events';

export type MatchStatus =
  | 'idle'
  | 'searching'
  | 'countdown'
  | 'playing'
  | 'resolving'
  | 'finished';

export type Outcome = 'won' | 'lost' | 'draw' | 'opponent_forfeit' | null;

interface GameStoreState {
  matchStatus: MatchStatus;
  mode: PvpMode;
  roomId: string | null;
  opponent: PublicPlayer | null;
  queueSize: number;
  state: GameState;
  round: number;
  /** Local timestamp (ms) at which the current turn — or the pre-match countdown — ends. */
  deadlineAt: number | null;
  outcome: Outcome;
  rewards: MatchRewards | null;
  selectedAction: GameAction | null;
  errorMessage: string | null;
  /** False while my own socket is down during a match. */
  connected: boolean;
  /** When the opponent dropped: local timestamp at which they forfeit. Null while they are connected. */
  opponentGraceUntil: number | null;

  // mutations
  setSearching: (mode: PvpMode, queueSize?: number) => void;
  setMatchFound: (roomId: string, opponent: PublicPlayer, countdownMs: number, mode: PvpMode) => void;
  setResumed: (payload: MatchResumePayload) => void;
  setTurnStart: (round: number, deadlineAt: number) => void;
  setStateUpdate: (state: GameState) => void;
  setOutcome: (outcome: Outcome, finalState: GameState, rewards: MatchRewards, mode: PvpMode) => void;
  setSelectedAction: (action: GameAction | null) => void;
  setError: (msg: string | null) => void;
  setConnected: (connected: boolean) => void;
  setOpponentStatus: (connected: boolean, graceMs?: number) => void;
  reset: () => void;
}

const baseInitial = {
  matchStatus: 'idle' as MatchStatus,
  mode: 'pvp_quick' as PvpMode,
  roomId: null as string | null,
  opponent: null as PublicPlayer | null,
  queueSize: 0,
  state: createInitialState(),
  round: 0,
  deadlineAt: null as number | null,
  outcome: null as Outcome,
  rewards: null as MatchRewards | null,
  selectedAction: null as GameAction | null,
  errorMessage: null as string | null,
  connected: true,
  opponentGraceUntil: null as number | null,
};

/** True while a match is running (found, being played, or being revealed). */
export const isInMatch = (status: MatchStatus): boolean =>
  status === 'countdown' || status === 'playing' || status === 'resolving';

export const useGameStore = create<GameStoreState>((set) => ({
  ...baseInitial,
  setSearching: (mode, queueSize = 0) =>
    set({ ...baseInitial, state: createInitialState(), mode, queueSize, matchStatus: 'searching' }),
  setMatchFound: (roomId, opponent, countdownMs, mode) =>
    set({
      ...baseInitial,
      state: createInitialState(),
      mode,
      roomId,
      opponent,
      deadlineAt: Date.now() + countdownMs,
      matchStatus: 'countdown',
    }),
  // My connection came back mid-match: the server sends the whole picture.
  setResumed: ({ roomId, mode, opponent, state, turnRemainingMs }) =>
    set({
      ...baseInitial,
      roomId,
      mode,
      opponent,
      state,
      round: turnRemainingMs === null ? state.round : state.round + 1,
      // Mid-turn: play it. Between two turns (or before the first): wait for the next turn:start.
      matchStatus: turnRemainingMs !== null ? 'playing' : state.round === 0 ? 'countdown' : 'resolving',
      deadlineAt: turnRemainingMs === null ? null : Date.now() + turnRemainingMs,
    }),
  setTurnStart: (round, deadlineAt) =>
    set({ matchStatus: 'playing', round, deadlineAt, selectedAction: null }),
  setStateUpdate: (state) =>
    set((s) => {
      // The initial state sent right after match:found must not leave the countdown.
      if (s.matchStatus === 'countdown' && state.round === 0) return { state };
      // A finished game is announced by game:over; until then keep revealing the turn.
      return { state, matchStatus: 'resolving', deadlineAt: null };
    }),
  setOutcome: (outcome, finalState, rewards, mode) =>
    set({
      outcome,
      state: finalState,
      rewards,
      mode,
      matchStatus: 'finished',
      deadlineAt: null,
      opponentGraceUntil: null,
    }),
  setSelectedAction: (action) => set({ selectedAction: action }),
  setError: (msg) => set({ errorMessage: msg }),
  setConnected: (connected) => set({ connected }),
  setOpponentStatus: (connected, graceMs) =>
    set({ opponentGraceUntil: connected ? null : Date.now() + (graceMs ?? 0) }),
  reset: () => set({ ...baseInitial, state: createInitialState() }),
}));
