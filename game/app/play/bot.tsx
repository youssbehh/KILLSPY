import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { Screen } from '@/src/ui/Screen';
import { Button } from '@/src/ui/Button';
import { Card } from '@/src/ui/Card';
import { ThemedText, Separator } from '@/src/ui/ThemedText';
import {
  GameAction,
  GameState,
  COUNTDOWN_DURATION_MS,
  TURN_DURATION_MS,
  MAX_AMMO,
  createInitialState,
  forcedAction,
  isActionLegal,
  resolveTurn,
} from '@/src/game/gameEngine';
import { BotMemory, chooseBotAction, createBotMemory, rememberPlayerAction } from '@/src/game/botAI';
import { spacing } from '@/src/theme/tokens';
import { useT } from '@/src/i18n';
import { useBotStore } from '@/src/stores/botStore';

type Phase = 'countdown' | 'choosing' | 'resolving' | 'finished';

// PvE games are NOT persisted — no MMR, no V/D stats. Just training.
export default function BotGameScreen() {
  const t = useT();
  const difficulty = useBotStore((s) => s.difficulty);
  const [state, setState] = useState<GameState>(createInitialState());
  const [phase, setPhase] = useState<Phase>('countdown');
  const [secondsLeft, setSecondsLeft] = useState(Math.ceil(COUNTDOWN_DURATION_MS / 1000));
  const [playerAction, setPlayerAction] = useState<GameAction | null>(null);
  const memoryRef = useRef<BotMemory>(createBotMemory());

  // Countdown initial
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (secondsLeft <= 0) {
      setPhase('choosing');
      setSecondsLeft(Math.ceil(TURN_DURATION_MS / 1000));
      return;
    }
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, secondsLeft]);

  // Tour de choix
  useEffect(() => {
    if (phase !== 'choosing') return;
    if (secondsLeft <= 0) {
      // Joueur AFK ou action choisie : on résout
      resolveRound(playerAction ?? forcedAction(state.player));
      return;
    }
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, secondsLeft, playerAction, state]);

  const resolveRound = (chosenPlayerAction: GameAction) => {
    setPhase('resolving');
    const botAction = chooseBotAction(state, memoryRef.current, difficulty);
    memoryRef.current = rememberPlayerAction(memoryRef.current, chosenPlayerAction);

    const next = resolveTurn(state, chosenPlayerAction, botAction);
    setState(next);
    setPlayerAction(null);

    setTimeout(() => {
      if (next.status === 'choosing') {
        setPhase('choosing');
        setSecondsLeft(Math.ceil(TURN_DURATION_MS / 1000));
      } else {
        // PvE: pas d'enregistrement (pas de V/D, pas de MMR).
        setPhase('finished');
      }
    }, 1500);
  };

  const handleAction = (action: GameAction) => {
    if (phase !== 'choosing') return;
    if (!isActionLegal(state.player, action)) return;
    setPlayerAction(action);
    // Petite pause visuelle puis résolution
    setTimeout(() => resolveRound(action), 300);
  };

  const outcomeText = useMemo(() => {
    if (state.status === 'won') return t('youWon');
    if (state.status === 'lost') return t('youLost');
    if (state.status === 'draw') return t('draw');
    return '';
  }, [state.status, t]);

  return (
    <>
      <Stack.Screen options={{ title: '', headerBackVisible: false, gestureEnabled: false }} />
      <Screen centered>
        <Card style={styles.opponentCard}>
          <ThemedText variant="h3">Bot ({difficulty})</ThemedText>
          <ThemedText variant="muted">
            Vies : {state.opponent.lives} · Munitions : {state.opponent.ammo}/{MAX_AMMO}
          </ThemedText>
          <ThemedText variant="caption">
            Action : {state.lastOpponentAction ? humanAction(state.lastOpponentAction, t) : '...'}
          </ThemedText>
        </Card>

        {phase === 'countdown' ? (
          <ThemedText variant="h1">{secondsLeft}</ThemedText>
        ) : phase === 'choosing' ? (
          <ThemedText variant="h1">{secondsLeft}</ThemedText>
        ) : phase === 'resolving' ? (
          <ThemedText variant="h3">Résolution…</ThemedText>
        ) : null}

        <Card style={styles.youCard} variant="highlighted">
          <ThemedText variant="h3">{t('welcomeAgent')}</ThemedText>
          <ThemedText variant="muted">
            Vies : {state.player.lives} · Munitions : {state.player.ammo}/{MAX_AMMO}
          </ThemedText>
          <ThemedText variant="caption">
            Action : {playerAction ? humanAction(playerAction, t) : '...'}
          </ThemedText>
        </Card>

        {phase === 'choosing' && (
          <View style={styles.actionRow}>
            <Button
              label={t('reload')}
              onPress={() => handleAction('reload')}
              disabled={!isActionLegal(state.player, 'reload') || !!playerAction}
              fullWidth={false}
            />
            <Button
              label={t('shoot')}
              onPress={() => handleAction('shoot')}
              disabled={!isActionLegal(state.player, 'shoot') || !!playerAction}
              variant="danger"
              fullWidth={false}
            />
            <Button
              label={t('shield')}
              onPress={() => handleAction('shield')}
              disabled={!!playerAction}
              variant="secondary"
              fullWidth={false}
            />
          </View>
        )}

        {phase === 'finished' && (
          <View style={styles.endRow}>
            <Separator />
            <ThemedText variant="h2">{outcomeText}</ThemedText>
            <View style={styles.endButtons}>
              <Button label={t('restart')} onPress={() => router.replace('/play/bot')} fullWidth={false} />
              <Button label={t('quit')} onPress={() => router.replace('/(tabs)/gamechoice')} variant="ghost" fullWidth={false} />
            </View>
          </View>
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
