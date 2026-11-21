import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { KS } from '../theme/colors';
import { TYPO, SIZES } from '../theme/typography';
import { TopoBg } from '../components/ks/TopoBg';
import { HexAvatar } from '../components/ks/HexAvatar';
import { RankBadge } from '../components/ks/RankBadge';
import { ActionCard, CardAction } from '../components/ks/ActionCard';
import { Countdown } from '../components/ks/Countdown';
import { Lives } from '../components/ks/Lives';
import { Ammo } from '../components/ks/Ammo';
import { useGameStore } from '../stores/gameStore';
import { useAuthStore } from '../stores/authStore';
import { GameAction, MAX_AMMO, TURN_DURATION_MS, isActionLegal } from '../game/gameEngine';
import { DangerButton } from '../components/ks/DangerButton';
import { CombatFx } from '../components/ks/CombatFx';
import { rankTierIndex } from '../game/rankDisplay';

// Map design card names to game engine action names
const CARD_ACTIONS: CardAction[] = ['fire', 'reload', 'shield'];
function toGameAction(card: CardAction): GameAction {
  if (card === 'fire') return 'shoot';
  return card;
}

interface Props {
  /** Called when the player locks an action for the current turn. */
  onAction: (action: GameAction) => void;
  onQuit: () => void;
}

const TURN_SECS = TURN_DURATION_MS / 1000;

export const HUDScreen: React.FC<Props> = ({ onAction, onQuit }) => {
  const insets = useSafeAreaInsets();
  const username = useAuthStore((s) => s.user?.username ?? 'AGENT');
  const mmr = useAuthStore((s) => s.user?.mmr ?? 0);

  const state = useGameStore((s) => s.state);
  const round = useGameStore((s) => s.round);
  const selectedAction = useGameStore((s) => s.selectedAction);
  const opponent = useGameStore((s) => s.opponent);
  const deadlineAt = useGameStore((s) => s.deadlineAt);
  const matchStatus = useGameStore((s) => s.matchStatus);
  const errorMessage = useGameStore((s) => s.errorMessage);
  const connected = useGameStore((s) => s.connected);
  const opponentGraceUntil = useGameStore((s) => s.opponentGraceUntil);
  const [graceSecs, setGraceSecs] = useState(0);

  // 'finished' is shown as a last reveal: the screen stays up while the final turn plays out.
  const resolving = matchStatus === 'resolving' || matchStatus === 'finished';
  const [countdown, setCountdown] = useState(TURN_SECS);
  const [startedAt] = useState(() => Date.now());
  const [elapsedSecs, setElapsedSecs] = useState(0);

  const blinkOp = useSharedValue(1);
  const recDot = useSharedValue(1);

  useEffect(() => {
    // REC dot blink
    recDot.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 600 }),
        withTiming(1, { duration: 600 }),
      ),
      -1,
      false,
    );
  }, []);

  useEffect(() => {
    if (countdown <= 2) {
      blinkOp.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 250 }),
          withTiming(1, { duration: 250 }),
        ),
        -1,
        false,
      );
    } else {
      blinkOp.value = withTiming(1, { duration: 100 });
    }
  }, [countdown <= 2]);

  // Turn countdown: derived from the server deadline, never from a local loop.
  useEffect(() => {
    const tick = () => {
      setElapsedSecs(Math.floor((Date.now() - startedAt) / 1000));
      setGraceSecs(opponentGraceUntil === null ? 0 : Math.max(0, Math.ceil((opponentGraceUntil - Date.now()) / 1000)));
      if (deadlineAt === null) return setCountdown(0);
      setCountdown(Math.max(0, Math.ceil((deadlineAt - Date.now()) / 1000)));
    };
    tick();
    const interval = setInterval(tick, 200);
    return () => clearInterval(interval);
  }, [deadlineAt, startedAt, opponentGraceUntil]);

  const blinkStyle = useAnimatedStyle(() => ({ opacity: blinkOp.value }));
  const recStyle = useAnimatedStyle(() => ({ opacity: recDot.value }));

  const locked = selectedAction !== null || resolving;

  const handleCardPress = useCallback(
    (card: CardAction) => {
      if (locked) return;
      const gameAction = toGameAction(card);
      if (!isActionLegal(state.player, gameAction)) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      onAction(gameAction);
    },
    [locked, state.player, onAction],
  );

  // During the reveal, show what each side actually played this turn.
  const revealedOpponent = resolving ? state.lastOpponentAction : null;
  const revealedSelf = resolving ? state.lastPlayerAction : selectedAction;

  const oppName = opponent?.username?.toUpperCase() ?? 'UNKNOWN';
  const totalTime = `${String(Math.floor(elapsedSecs / 60)).padStart(2, '0')}:${String(elapsedSecs % 60).padStart(2, '0')}`;

  return (
    <View style={styles.container}>
      <TopoBg />

      {/* Eyebrow */}
      <View style={[styles.eyebrow, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.roundLabel}>
          // LIVE OPS · ROUND {String(Math.max(1, round)).padStart(2, '0')}
        </Text>
        <View style={styles.recRow}>
          <Animated.View style={[styles.recDot, recStyle]} />
          <Text style={styles.recText}>REC · {totalTime}</Text>
        </View>
      </View>

      {/* ── Opponent zone ── */}
      <View style={styles.oppZone}>
        {/* Header strip */}
        <View style={styles.playerStrip}>
          <View style={styles.playerLeft}>
            <HexAvatar size={36} tier="silver" initials={oppName.slice(0,2)} />
            <View>
              <Text style={styles.oppName}>{oppName}</Text>
              <View style={styles.tagRow}>
                <Text style={[styles.tagLabel, { color: KS.enemy }]}>OPPONENT</Text>
              </View>
            </View>
          </View>
          <View style={styles.statusChip}>
            <Text style={[styles.statusText, { color: resolving ? KS.alert : KS.inkDim }]}>
              {opponentGraceUntil !== null ? '✕ OFFLINE' : resolving ? '◉ REVEALED' : '⌛ THINKING'}
            </Text>
          </View>
        </View>

        {/* Face-down cards */}
        <View style={styles.cardsRow}>
          {CARD_ACTIONS.map((action) => (
            <ActionCard
              key={action}
              action={action}
              faceUp={revealedOpponent === toGameAction(action)}
              selected={revealedOpponent === toGameAction(action)}
            />
          ))}
        </View>

        {/* Opponent info row */}
        <View style={styles.infoRow}>
          <Ammo current={state.opponent.ammo} max={MAX_AMMO} color={KS.enemy} />
          <Lives alive={state.opponent.lives} />
        </View>
      </View>

      {/* ── Center countdown ── */}
      <View style={styles.center}>
        <Text style={styles.resolvingIn}>{resolving ? 'RESOLVING' : 'RESOLVING IN'}</Text>
        <Countdown value={countdown} max={TURN_SECS} />
        <Animated.Text style={[styles.lockLabel, blinkStyle]}>
          {!connected
            ? '⚠ CONNECTION LOST · RECONNECTING'
            : opponentGraceUntil !== null
              ? `OPPONENT DISCONNECTED · FORFEIT IN ${graceSecs}S`
              : errorMessage ?? (selectedAction ? 'ACTION LOCKED' : countdown <= 2 ? '⚠ LOCK YOUR ACTION' : 'LOCK YOUR ACTION')}
        </Animated.Text>
      </View>

      {/* ── Self zone ── */}
      <View style={styles.selfZone}>
        {/* Info row */}
        <View style={styles.infoRow}>
          <View style={styles.statusChip}>
            <Text style={[styles.statusText, { color: selectedAction ? KS.live : KS.alert }]}>
              {selectedAction ? '✓ LOCKED' : '◉ ARMED'}
            </Text>
          </View>
          <Lives alive={state.player.lives} />
          <Ammo current={state.player.ammo} max={MAX_AMMO} color={KS.primary} />
        </View>

        {/* Face-up cards */}
        <View style={styles.cardsRow}>
          {CARD_ACTIONS.map((action) => {
            const gameAction = toGameAction(action);
            const isSelected = revealedSelf === gameAction;
            const isDisabled = !isActionLegal(state.player, gameAction) || (locked && !isSelected);
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

        {/* Footer strip */}
        <View style={styles.playerStrip}>
          <View style={styles.playerLeft}>
            <HexAvatar size={36} tier="gold" initials={username.slice(0,2)} live />
            <View>
              <Text style={styles.selfName}>{username.toUpperCase()}</Text>
              <View style={styles.tagRow}>
                <RankBadge tier={rankTierIndex(mmr)} size={16} />
                <Text style={[styles.tagLabel, { color: KS.primary }]}>YOU</Text>
              </View>
            </View>
          </View>
          <DangerButton label="FORFEIT" onPress={onQuit} />
        </View>
      </View>

      {/* Shot / shield / reload effects of the turn being revealed */}
      <CombatFx state={state} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: KS.bg },
  eyebrow: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roundLabel: {
    color: KS.primary,
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
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },
  recText: {
    color: KS.live,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoSm,
    letterSpacing: SIZES.monoSm * 0.18,
  },
  oppZone: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  playerStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
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
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
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
  selfZone: {
    paddingHorizontal: 16,
    paddingBottom: 80,
    gap: 10,
  },
});
