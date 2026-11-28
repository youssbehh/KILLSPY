import { create } from 'zustand';
import { ACTIVE_THEME_ID, saveActiveTheme } from '../theme/activeTheme';
import { ThemeId, themes } from '../theme/themes';

interface ThemeState {
  /** Theme equipped on the account (may differ from the one this run was built with). */
  equippedId: ThemeId;
  /** True when the equipped theme only shows after a restart. */
  restartPending: boolean;
  setEquipped: (id: ThemeId) => void;
}

export const useThemeStore = create<ThemeState>()((set) => ({
  equippedId: ACTIVE_THEME_ID,
  restartPending: false,
  setEquipped: (id) => set({ equippedId: id, restartPending: saveActiveTheme(id) }),
}));

/** The theme the screens are drawn with right now. */
export const useTheme = () => themes[ACTIVE_THEME_ID];
