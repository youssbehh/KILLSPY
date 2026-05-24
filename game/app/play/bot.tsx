import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router, Stack } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import {
  GameAction,
  GameState,
  COUNTDOWN_DURATION_MS,
  TURN_DURATION_MS,
  createInitialState,
  forcedAction,
  isActionLegal,
  resolveTurn,
} from '@/src/game/gameEngine';
import { BotMemory, chooseBotAction, createBotMemory, rememberPlayerAction } from '@/src/game/botAI';
import { useBotStore } from '@/src/stores/botStore';
import { useAuthStore } from '@/src/stores/authStore';
import { KS } from '@/src/theme/colors';
import { TYPO, SIZES } from '@/src/theme/typography';
import { TopoBg } from '@/src/components/ks/TopoBg';
import { HexAvatar } from '@/src/components/ks/HexAvatar';
import { RankBadge } from '@/src/components/ks/RankBadge';
import { ActionCard, CardAction } from '@/src/components/ks/ActionCard';
import { Countdown } from '@/src/components/ks/Countdown';
import { Lives } from '@/src/components/ks/Lives';
import { Ammo } from '@/src/components/ks/Ammo';
import { EndMatchScreen } from '@/src/screens/EndMatchScreen';

type Phase = 'countdown' | 'choosing' | 'resolving' | 'finished';

const CARD_ACTIONS: CardAction[] = ['fire', 'reload', 'shield'];
function toGameAction(card: CardAction): GameAction {
  return card === 'fire' ? 'shoot' : card;
}

const TURN_SECS = Math.ceil(TURN_DURATION_MS / 1000);
const COUNTDOWN_SECS = Math.ceil(COUNTDOWN_DURATION_MS / 1000);

const DIFF_LABELS: Record<string, string> = {
  easy:   'FIELD AGENT',
  medium: 'VETERAN OPS',
  hard:   'PHANTOM UNIT',
};

export default function BotGameScreen() {
  const difficulty = useBotStore((s) => s.difficulty);
  const username = useAuthStore((s) => s.user?.username ?? 'AGENT_KILO');

  const [state, setState] = useState<GameState>(createInitialState());
  const [phase, setPhase] = useState<Phase>('countdown');
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECS);
  const [playerAction, setPlayerAction] = useState<GameAction | null>(null);
  const memoryRef = useRef<BotMemory>(createBotMemory());

  const blinkOp = useSharedValue(1);
  const recDot = useSharedValue(1);

  useEffect(() => {
    recDot.value = withRepeat(
      withSequence(withTiming(0, { duration: 600 }), withTiming(1, { duration: 600 })),
      -1, false,
    );
  }, []);

  useEffect(() => {
    if (secondsLeft <= 2) {
      blinkOp.value = withRepeat(
        withSequence(withTiming(0.3, { duration: 250 }), withTiming(1, { duration: 250 })),
        -1, false,
      );
    } else {
      blinkOp.value = withTiming(1, { duration: 100 });
    }
  }, [secondsLeft <= 2]);

  // Initial countdown before first turn
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (secondsLeft <= 0) {
      setPhase('choosing');
      setSecondsLeft(TURN_SECS);
      return;
    }
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, secondsLeft]);

  // Turn countdown
  useEffect(() => {
    if (phase !== 'choosing') return;
    if (secondsLeft <= 0) {
      resolveRound(playerAction ?? forcedAction(state.player));
      return;
    }
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, secondsLeft]);

  const resolveRound = useCallback((chosenAction: GameAction) => {
    setPhase('resolving');
    const botAction = chooseBotAction(state, memoryRef.current, difficulty);
    memoryRef.current = rememberPlayerAction(memoryRef.current, chosenAction);
    const next = resolveTurn(state, chosenAction, botAction);
    setState(next);
    setPlayerAction(null);
    setTimeout(() => {
      if (next.status === 'choosing') {
        setPhase('choosing');
        setSecondsLeft(TURN_SECS);
      } else {
        setPhase('finished');
      }
    }, 800);
  }, [state, difficulty]);

  const handleCardPress = useCallback((card: CardAction) => {
    if (phase !== 'choosing') return;
    const gameAction = toGameAction(card);
    if (!isActionLegal(state.player, gameAction)) return;
    if (playerAction) return;
    setPlayerAction(gameAction);
    setTimeout(() => resolveRound(gameAction), 300);
  }, [phase, state, playerAction, resolveRound]);

  const blinkStyle = useAnimatedStyle(() => ({ opacity: blinkOp.value }));
  const recStyle = useAnimatedStyle(() => ({ opacity: recDot.value }));

  const isChoosing = phase === 'choosing';
  const countdownVal = phase === 'countdown' ? secondsLeft : isChoosing ? secondsLeft : 0;

  if (phase === 'finished') {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <EndMatchScreen
          outcome={state.status === 'won' ? 'won' : 'lost'}
          xpEarned={state.status === 'won' ? 640 : 180}
          rpDelta={0}
          onContinue={() => router.replace('/(tabs)/gamechoice')}
          onRematch={() => router.replace('/play/bot')}
          onHome={() => router.replace('/(tabs)/gamechoice')}
        />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
      <View style={styles.container}>
        <TopoBg />

        {/* Eyebrow */}
        <View style={styles.eyebrow}>
          <Text style={styles.roundLabel}>
            // TRAINING · ROUND {String(state.round + 1).padStart(2, '0')}
          </Text>
          <View style={styles.recRow}>
            <Animated.View style={[styles.recDot, recStyle]} />
            <Text style={styles.recText}>TRAINING</Text>
          </View>
        </View>

        {/* ── Opponent (bot) zone ── */}
        <View style={styles.zone}>
          <View style={styles.playerStrip}>
            <View style={styles.playerLeft}>
              <HexAvatar size={36} tier="phantom" initials="AI" />
              <View>
                <Text style={styles.oppName}>
                  {DIFF_LABELS[difficulty]} BOT
                </Text>
                <View style={styles.tagRow}>
                  <RankBadge tier={4} size={16} />
                  <Text style={[styles.tagLabel, { color: KS.enemy }]}>OPPONENT</Text>
                </View>
              </View>
            </View>
            <View style={styles.statusChip}>
              <Text style={[styles.statusText, { color: KS.inkDim }]}>
                {phase === 'resolving' ? '⚙ COMPUTING' : '⌛ THINKING'}
              </Text>
            </View>
          </View>

          {/* Face-down cards */}
          <View style={styles.cardsRow}>
            {CARD_ACTIONS.map((action) => (
              <ActionCard key={action} action={action} faceUp={false} />
            ))}
          </View>

          <View style={styles.infoRow}>
            <Ammo current={state.opponent.ammo} color={KS.enemy} />
            <Lives alive={state.opponent.lives} />
          </View>
        </View>

        {/* ── Center ── */}
        <View style={styles.center}>
          {phase === 'countdown' ? (
            <>
              <Text style={styles.resolvingIn}>MATCH STARTS IN</Text>
              <Countdown value={secondsLeft} max={COUNTDOWN_SECS} />
            </>
          ) : (
            <>
              <Text style={styles.resolvingIn}>
                {phase === 'resolving' ? 'RESOLVING...' : 'RESOLVING IN'}
              </Text>
              <Countdown value={isChoosing ? secondsLeft : 0} max={TURN_SECS} />
              <Animated.Text style={[styles.lockLabel, blinkStyle]}>
                {secondsLeft <= 2 && isChoosing ? '⚠ LOCK YOUR ACTION' : 'LOCK YOUR ACTION'}
              </Animated.Text>
            </>
          )}
        </View>

        {/* ── Self zone ── */}
        <View style={styles.zone}>
          <View style={styles.infoRow}>
            <View style={styles.statusChip}>
              <Text style={[styles.statusText, { color: playerAction ? KS.live : KS.alert }]}>
                {playerAction ? '✓ LOCKED' : '◉ ARMED'}
              </Text>
            </View>
            <Lives alive={state.player.lives} />
            <Ammo current={state.player.ammo} color={KS.primary} />
          </View>

          <View style={styles.cardsRow}>
            {CARD_ACTIONS.map((action) => {
              const gameAction = toGameAction(action);
              const isSelected = playerAction === gameAction;
              const isDisabled =
                phase !== 'choosing' ||
                !!playerAction ||
                !isActionLegal(state.player, gameAction);
              return (
                <ActionCard
                  key={action}
                  action={action}
                  faceUp
                  selected={isSelected}
                  disabled={isDisabled}
                  onPress={() => handleCardPress(action)}
                />
              );
            })}
          </View>

          <View style={styles.playerStrip}>
            <View style={styles.playerLeft}>
              <HexAvatar size={36} tier="gold" initials={username.slice(0, 2)} live />
              <View>
                <Text style={styles.selfName}>{username.toUpperCase()}</Text>
                <Text style={[styles.tagLabel, { color: KS.primary }]}>YOU</Text>
              </View>
            </View>
            <View style={styles.diffBadge}>
              <Text style={styles.diffBadgeText}>{difficulty.toUpperCase()}</Text>
            </View>
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: KS.bg },
  eyebrow: {
    paddingTop: 60,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roundLabel: {
    color: KS.live,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoSm,
    letterSpacing: SIZES.monoSm * 0.18,
  },
  recRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  recDot: {
    width: 7, height: 7, borderRadius: 3.5,
    backgroundColor: KS.live,
    shadowColor: KS.live,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1, shadowRadius: 3, elevation: 2,
  },
  recText: {
    color: KS.live,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoSm,
    letterSpacing: SIZES.monoSm * 0.18,
  },
  zone: { paddingHorizontal: 16, paddingTop: 12, gap: 10 },
  playerStrip: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  playerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  oppName: {
    color: KS.ink,
    fontFamily: TYPO.display,
    fontSize: SIZES.titleSm,
    letterSpacing: SIZES.titleSm * 0.04,
  },
  selfName: {
    color: KS.ink,
    fontFamily: TYPO.display,
    fontSize: SIZES.titleSm,
    letterSpacing: SIZES.titleSm * 0.04,
  },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tagLabel: {
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoXs,
    letterSpacing: SIZES.monoXs * 0.18,
  },
  statusChip: {
    backgroundColor: KS.surface,
    borderWidth: 1,
    borderColor: KS.hairSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoXs,
    letterSpacing: SIZES.monoXs * 0.18,
  },
  cardsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  resolvingIn: {
    color: KS.inkDim,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoSm,
    letterSpacing: SIZES.monoSm * 0.18,
  },
  lockLabel: {
    color: KS.alert,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoSm,
    letterSpacing: SIZES.monoSm * 0.18,
  },
  diffBadge: {
    backgroundColor: 'rgba(57,255,20,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(57,255,20,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  diffBadgeText: {
    color: KS.live,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoXxs,
    letterSpacing: SIZES.monoXxs * 0.18,
  },
});
