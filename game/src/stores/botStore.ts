import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BotDifficulty } from '../game/botAI';

interface BotState {
  difficulty: BotDifficulty;
  setDifficulty: (d: BotDifficulty) => void;
}

export const useBotStore = create<BotState>()(
  persist(
    (set) => ({
      difficulty: 'easy',
      setDifficulty: (d) => set({ difficulty: d }),
    }),
    {
      name: 'killspy.bot',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
