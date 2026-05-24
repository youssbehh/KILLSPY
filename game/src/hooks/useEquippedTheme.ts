import { useEffect } from 'react';
import { useInventory } from './useInventory';
import { useThemeStore } from '../stores/themeStore';
import { ThemeId, THEME_COSMETIC_META, DEFAULT_THEME_ID } from '../theme/themes';

/**
 * Map a cosmetic item NAME (as stored in DB) to the local ThemeId.
 * Built from THEME_COSMETIC_META so the two stay in sync.
 */
const NAME_TO_THEME_ID: Record<string, ThemeId> = Object.entries(THEME_COSMETIC_META)
  .reduce((acc, [id, meta]) => {
    acc[meta.label] = id as ThemeId;
    return acc;
  }, {} as Record<string, ThemeId>);

/**
 * Read the user's currently equipped `ui_theme` cosmetic and push it into the
 * local themeStore so the UI re-renders with the right palette.
 *
 * - Falls back to DEFAULT_THEME_ID (spyCasual) if nothing is equipped or
 *   the server returns an unknown theme name.
 * - Mount once at the root layout (after QueryClientProvider) — it's a fire
 *   and forget effect, no rendering of its own.
 */
export const useEquippedTheme = () => {
  const { data } = useInventory();
  const setTheme = useThemeStore((s) => s.setTheme);
  const currentThemeId = useThemeStore((s) => s.themeId);

  useEffect(() => {
    const equipped = data?.equipped?.ui_theme;
    if (!equipped) return;

    const themeId = NAME_TO_THEME_ID[equipped.name];
    if (!themeId) {
      // Unknown theme name (server has cosmetic we don't know about yet).
      // Don't change anything to avoid flashing the default on rare server data.
      return;
    }

    if (themeId !== currentThemeId) {
      setTheme(themeId);
    }
  }, [data?.equipped?.ui_theme?.itemId, currentThemeId, setTheme]);
};

export const fallbackThemeId = DEFAULT_THEME_ID;
