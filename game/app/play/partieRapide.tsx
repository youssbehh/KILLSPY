import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Screen } from '@/src/ui/Screen';
import { Button } from '@/src/ui/Button';
import { Card } from '@/src/ui/Card';
import { ThemedText, Separator } from '@/src/ui/ThemedText';
import { useGameStore } from '@/src/stores/gameStore';
import { useMatchmaking } from '@/src/sockets/useMatchmaking';
import { GameAction, MAX_AMMO, isActionLegal } from '@/src/game/gameEngine';
import { spacing } from '@/src/theme/tokens';
import { useT } from '@/src/i18n';

export default function PartieRapideScreen() {
  const t = useT();
  const router = useRouter();
  const { sendAction, leaveGame } = useMatchmaking();

  const {
    matchStatus,
    opponent,
    state,
    round,
    deadlineAt,
    outcome,
    selectedAction,
    errorMessage,
    setSelectedAction,
  } = useGameStore();

  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!deadlineAt || matchStatus !== 'playing') {
      setSecondsLeft(null);
      return;
    }
    const tick = () => {
      const ms = Math.max(0, deadlineAt - Date.now());
      setSecondsLeft(Math.ceil(ms / 1000));
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [deadlineAt, matchStatus]);

  const handleAction = (action: GameAction) => {
    if (!isActionLegal(state.player, action)) return;
    setSelectedAction(action);
    sendAction(action);
  };

  const handleQuit = () => {
    leaveGame();
    router.replace('/(tabs)/gamechoice');
  };

  const handleRestart = () => {
    router.replace('/loading');
  };

  const outcomeText = useMemo(() => {
    if (outcome === 'won') return t('youWon');
    if (outcome === 'lost') return t('youLost');
    if (outcome === 'draw') return t('draw');
    if (outcome === 'opponent_forfeit') return `${opponent?.username ?? 'Adversaire'} a abandonné.`;
    return '';
  }, [outcome, opponent, t]);

  const inLobby = matchStatus === 'countdown' || matchStatus === 'searching';
  const isPlaying = matchStatus === 'playing';
  const isResolving = matchStatus === 'resolving';
  const isFinished = matchStatus === 'finished';

  return (
    <>
      <Stack.Screen options={{ title: '', headerBackVisible: false, gestureEnabled: false }} />
      <Screen centered>
        {errorMessage ? (
          <Card>
            <ThemedText variant="muted">{errorMessage}</ThemedText>
          </Card>
        ) : null}

        <Card style={styles.opponentCard}>
          <ThemedText variant="h3">{opponent?.username ?? '...'}</ThemedText>
          <ThemedText variant="muted">
            {t('rank')} — Vies : {state.opponent.lives} · Munitions : {state.opponent.ammo}/{MAX_AMMO}
          </ThemedText>
          <ThemedText variant="caption">
            Action : {state.lastOpponentAction ? humanAction(state.lastOpponentAction, t) : '...'}
          </ThemedText>
        </Card>

        {isPlaying ? (
          <ThemedText variant="h1">{secondsLeft ?? '—'}</ThemedText>
        ) : inLobby ? (
          <ThemedText variant="h3">{t('searchingGame')}</ThemedText>
        ) : isResolving ? (
          <ThemedText variant="h3">Résolution…</ThemedText>
        ) : null}

        <Card style={styles.youCard} variant="highlighted">
          <ThemedText variant="h3">{t('welcomeAgent')}</ThemedText>
          <ThemedText variant="muted">
            Vies : {state.player.lives} · Munitions : {state.player.ammo}/{MAX_AMMO}
          </ThemedText>
          <ThemedText variant="caption">
            Action : {selectedAction ? humanAction(selectedAction, t) : '...'}
          </ThemedText>
        </Card>

        {isPlaying && (
          <View style={styles.actionRow}>
            <Button
              label={t('reload')}
              onPress={() => handleAction('reload')}
              disabled={!isActionLegal(state.player, 'reload') || !!selectedAction}
              size="md"
              fullWidth={false}
            />
            <Button
              label={t('shoot')}
              onPress={() => handleAction('shoot')}
              disabled={!isActionLegal(state.player, 'shoot') || !!selectedAction}
              variant="danger"
              size="md"
              fullWidth={false}
            />
            <Button
              label={t('shield')}
              onPress={() => handleAction('shield')}
              disabled={!!selectedAction}
              variant="secondary"
              size="md"
              fullWidth={false}
            />
          </View>
        )}

        {isFinished && (
          <View style={styles.endRow}>
            <Separator />
            <ThemedText variant="h2">{outcomeText}</ThemedText>
            <View style={styles.endButtons}>
              <Button label={t('restart')} onPress={handleRestart} fullWidth={false} />
              <Button label={t('quit')} onPress={handleQuit} variant="ghost" fullWidth={false} />
            </View>
          </View>
        )}

        {!isFinished && (
          <Button
            label={t('quit')}
            onPress={handleQuit}
            variant="ghost"
            size="sm"
            fullWidth={false}
          />
        )}
      </Screen>
    </>
  );
}

const humanAction = (action: GameAction, t: ReturnType<typeof useT>) => {
  if (action === 'shield') return t('shield');
  if (action === 'shoot') return t('shoot');
  return t('reload');
};

const styles = StyleSheet.create({
  opponentCard: { width: '90%' },
  youCard: { width: '90%' },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  endRow: { alignItems: 'center', marginTop: spacing.md },
  endButtons: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
});
