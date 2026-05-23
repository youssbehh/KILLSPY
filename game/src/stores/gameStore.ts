import { create } from 'zustand';
import { GameAction, GameState, createInitialState } from '../game/gameEngine';
import { PublicPlayer } from '../sockets/events';

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
  roomId: string | null;
  opponent: PublicPlayer | null;
  state: GameState;
  round: number;
  deadlineAt: number | null;
  outcome: Outcome;
  selectedAction: GameAction | null;
  errorMessage: string | null;

  // mutations
  setSearching: () => void;
  setMatchFound: (roomId: string, opponent: PublicPlayer, countdownMs: number) => void;
  setTurnStart: (round: number, deadlineAt: number) => void;
  setStateUpdate: (state: GameState) => void;
  setOutcome: (outcome: Outcome, finalState: GameState) => void;
  setSelectedAction: (action: GameAction | null) => void;
  setError: (msg: string | null) => void;
  reset: () => void;
}

const baseInitial = {
  matchStatus: 'idle' as MatchStatus,
  roomId: null as string | null,
  opponent: null as PublicPlayer | null,
  state: createInitialState(),
  round: 0,
  deadlineAt: null as number | null,
  outcome: null as Outcome,
  selectedAction: null as GameAction | null,
  errorMessage: null as string | null,
};

export const useGameStore = create<GameStoreState>((set) => ({
  ...baseInitial,
  setSearching: () => set({ ...baseInitial, matchStatus: 'searching' }),
  setMatchFound: (roomId, opponent) =>
    set({
      ...baseInitial,
      roomId,
      opponent,
      matchStatus: 'countdown',
    }),
  setTurnStart: (round, deadlineAt) =>
    set({ matchStatus: 'playing', round, deadlineAt, selectedAction: null }),
  setStateUpdate: (state) =>
    set({ state, matchStatus: state.status === 'choosing' ? 'resolving' : 'finished' }),
  setOutcome: (outcome, finalState) =>
    set({ outcome, state: finalState, matchStatus: 'finished' }),
  setSelectedAction: (action) => set({ selectedAction: action }),
  setError: (msg) => set({ errorMessage: msg }),
  reset: () => set(baseInitial),
}));
