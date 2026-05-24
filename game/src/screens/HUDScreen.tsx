import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
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
import { GameAction, TURN_DURATION_MS, isActionLegal } from '../game/gameEngine';

// Map design card names to game engine action names
const CARD_ACTIONS: CardAction[] = ['fire', 'reload', 'shield'];
function toGameAction(card: CardAction): GameAction {
  if (card === 'fire') return 'shoot';
  return card;
}

const TURN_SECS = TURN_DURATION_MS / 1000;

export const HUDScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const username = useAuthStore((s) => s.user?.username ?? 'AGENT_KILO');

  const { state, round, selectedAction, setSelectedAction, opponent } = useGameStore();
  const [countdown, setCountdown] = useState(TURN_SECS);
  const [resolving, setResolving] = useState(false);

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

  // Turn countdown tick
  useEffect(() => {
    if (resolving) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setResolving(true);
          setTimeout(() => {
            setResolving(false);
            setCountdown(TURN_SECS);
          }, 800);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [resolving]);

  const blinkStyle = useAnimatedStyle(() => ({ opacity: blinkOp.value }));
  const recStyle = useAnimatedStyle(() => ({ opacity: recDot.value }));

  const handleCardPress = useCallback(
    (card: CardAction) => {
      const gameAction = toGameAction(card);
      if (card === 'fire' && !isActionLegal(state.player, 'shoot')) return;
      setSelectedAction(selectedAction === gameAction ? null : gameAction);
    },
    [selectedAction, state.player],
  );

  const oppName = opponent?.username?.toUpperCase() ?? 'SHADOW_09';
  const totalTime = `${String(Math.floor(round * TURN_SECS / 60)).padStart(2,'0')}:${String((round * TURN_SECS) % 60).padStart(2,'0')}`;

  return (
    <View style={styles.container}>
      <TopoBg />

      {/* Eyebrow */}
      <View style={styles.eyebrow}>
        <Text style={styles.roundLabel}>
          // LIVE OPS · ROUND {String(round + 1).padStart(2, '0')}
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
            <HexAvatar size={36} tier="diamond" initials={oppName.slice(0,2)} />
            <View>
              <Text style={styles.oppName}>{oppName}</Text>
              <View style={styles.tagRow}>
                <RankBadge tier={3} size={16} />
                <Text style={[styles.tagLabel, { color: KS.enemy }]}>OPPONENT</Text>
              </View>
            </View>
          </View>
          <View style={styles.statusChip}>
            <Text style={[styles.statusText, { color: KS.inkDim }]}>⌛ THINKING</Text>
          </View>
        </View>

        {/* Face-down cards */}
        <View style={styles.cardsRow}>
          {CARD_ACTIONS.map((action) => (
            <ActionCard key={action} action={action} faceUp={false} />
          ))}
        </View>

        {/* Opponent info row */}
        <View style={styles.infoRow}>
          <Ammo current={state.opponent.ammo} color={KS.enemy} />
          <Lives alive={state.opponent.lives} />
        </View>
      </View>

      {/* ── Center countdown ── */}
      <View style={styles.center}>
        <Text style={styles.resolvingIn}>RESOLVING IN</Text>
        <Countdown value={countdown} max={TURN_SECS} />
        <Animated.Text style={[styles.lockLabel, blinkStyle]}>
          {countdown <= 2 ? '⚠ LOCK YOUR ACTION' : 'LOCK YOUR ACTION'}
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
          <Ammo current={state.player.ammo} color={KS.primary} />
        </View>

        {/* Face-up cards */}
        <View style={styles.cardsRow}>
          {CARD_ACTIONS.map((action) => {
            const gameAction = toGameAction(action);
            const isSelected = selectedAction === gameAction;
            const isDisabled = action === 'fire' && !isActionLegal(state.player, 'shoot');
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
              <Text style={[styles.tagLabel, { color: KS.primary }]}>YOU</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

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
