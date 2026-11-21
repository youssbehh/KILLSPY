import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useMyHistory } from '../../hooks/useGames';
import { GameHistoryItem, HistoryMode } from '../../api/games';
import { useLocalT } from '../../i18n/local';
import { KS } from '../../theme/colors';
import { TYPO, SIZES } from '../../theme/typography';
import { SectionLabel } from './SectionLabel';

const STRINGS = {
  fr: {
    title: 'Historique des parties',
    empty: 'Aucune partie jouée pour le moment.',
    error: 'Historique indisponible. Touche pour réessayer.',
    more: 'VOIR PLUS',
    won: 'VICTOIRE',
    lost: 'DÉFAITE',
    draw: 'NUL',
    rounds: '{n} tours',
    vs: 'contre {name}',
    bot: "contre l'IA",
    unknown: 'adversaire inconnu',
    pve: 'ENTRAÎNEMENT',
    pvp_quick: 'RAPIDE',
    pvp_ranked: 'CLASSÉ',
  },
  en: {
    title: 'Match history',
    empty: 'No match played yet.',
    error: 'History unavailable. Tap to retry.',
    more: 'LOAD MORE',
    won: 'VICTORY',
    lost: 'DEFEAT',
    draw: 'DRAW',
    rounds: '{n} rounds',
    vs: 'vs {name}',
    bot: 'vs the AI',
    unknown: 'unknown opponent',
    pve: 'TRAINING',
    pvp_quick: 'QUICK',
    pvp_ranked: 'RANKED',
  },
} as const;

/** Paginated list of the player's matches (PvP and training), newest first. */
export const MatchHistory: React.FC = () => {
  const t = useLocalT(STRINGS);
  const { games, isLoading, isError, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } = useMyHistory();

  return (
    <View style={styles.wrap}>
      <SectionLabel label={t('title')} color={KS.primary} />

      {isLoading && <ActivityIndicator color={KS.primary} style={styles.state} />}

      {isError && (
        <Pressable onPress={() => refetch()} accessibilityRole="button" style={styles.state}>
          <Text style={[styles.stateText, { color: KS.danger }]}>{t('error')}</Text>
        </Pressable>
      )}

      {!isLoading && !isError && games.length === 0 && (
        <Text style={[styles.stateText, styles.state]}>{t('empty')}</Text>
      )}

      {games.map((game: GameHistoryItem) => {
        const result = game.draw ? 'draw' : game.won ? 'won' : 'lost';
        const color = result === 'won' ? KS.live : result === 'draw' ? KS.alert : KS.danger;
        const opponent =
          game.mode === 'pve' ? t('bot') : game.opponent ? t('vs', { name: game.opponent }) : t('unknown');
        return (
          <View key={game.id} style={styles.row}>
            <View style={[styles.stripe, { backgroundColor: color }]} />
            <View style={styles.main}>
              <Text style={[styles.result, { color }]}>{t(result)}</Text>
              <Text style={styles.detail} numberOfLines={1}>
                {t(game.mode as HistoryMode)} · {opponent}
                {game.rounds > 0 ? ` · ${t('rounds', { n: game.rounds })}` : ''}
              </Text>
            </View>
            <View style={styles.side}>
              {game.mode === 'pvp_ranked' && (
                <Text style={[styles.delta, { color: game.mmrDelta >= 0 ? KS.live : KS.danger }]}>
                  {game.mmrDelta > 0 ? '+' : ''}{game.mmrDelta} RP
                </Text>
              )}
              {game.xpDelta > 0 && <Text style={styles.xp}>+{game.xpDelta} XP</Text>}
              <Text style={styles.date}>{new Date(game.date).toLocaleDateString()}</Text>
            </View>
          </View>
        );
      })}

      {hasNextPage && (
        <Pressable
          onPress={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          accessibilityRole="button"
          accessibilityLabel={t('more')}
          style={styles.more}
        >
          {isFetchingNextPage ? (
            <ActivityIndicator color={KS.primary} />
          ) : (
            <Text style={styles.moreText}>{t('more')}</Text>
          )}
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { marginTop: 16, gap: 6 },
  state: { paddingVertical: 20, alignSelf: 'center' },
  stateText: { color: KS.inkDim, fontFamily: TYPO.ui, fontSize: SIZES.body, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    backgroundColor: KS.surface,
    borderWidth: 1,
    borderColor: KS.hairSoft,
    borderRadius: 4,
    overflow: 'hidden',
  },
  stripe: { width: 3, alignSelf: 'stretch' },
  main: { flex: 1, paddingHorizontal: 10, paddingVertical: 6, gap: 2 },
  result: { fontFamily: TYPO.display, fontSize: SIZES.labelLg, letterSpacing: SIZES.labelLg * 0.06 },
  detail: { color: KS.inkDim, fontFamily: TYPO.mono, fontSize: SIZES.monoSm },
  side: { alignItems: 'flex-end', paddingRight: 10, gap: 1 },
  delta: { fontFamily: TYPO.monoBold, fontSize: SIZES.monoMd },
  xp: { color: KS.primary, fontFamily: TYPO.mono, fontSize: SIZES.monoSm },
  date: { color: KS.inkFaint, fontFamily: TYPO.mono, fontSize: SIZES.monoXs },
  more: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: KS.hair,
    borderRadius: 4,
    marginTop: 2,
  },
  moreText: {
    color: KS.primary,
    fontFamily: TYPO.display,
    fontSize: SIZES.labelLg,
    letterSpacing: SIZES.labelLg * 0.06,
  },
});
