import React, { useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  SharedValue,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { GameAction, GameState } from '../../game/gameEngine';
import { KS } from '../../theme/colors';
import { TYPO, SIZES } from '../../theme/typography';
import { MOTION } from '../../theme/motion';

/**
 * Turn-resolution effects, drawn over the duel screen.
 *
 * Every time `state.round` advances, both sides replay what they did this turn:
 *   shoot  → muzzle flash, tracer flying to the other side, impact (or stopped by a shield)
 *   shield → energy barrier in front of the player, flaring when it blocks a shot
 *   reload → spinning chamber ring and a rising "+1"
 * A hit also flashes the victim's half of the screen.
 *
 * The component is purely visual (pointerEvents none) and reads everything from
 * the engine state, so PvP and the bot mode share it as-is.
 */

type Side = 'player' | 'opponent';

interface Props {
  state: GameState;
}

interface TurnFx {
  round: number;
  playerAction: GameAction | null;
  opponentAction: GameAction | null;
  playerHit: boolean;
  opponentHit: boolean;
}

const SIDE_COLOR: Record<Side, string> = { player: KS.primary, opponent: KS.enemy };
const SHIELD_COLOR = KS.tier.diamond;

// Keyframes on the shared 0 → 1 timeline (MOTION.combat ms).
const T = {
  muzzle: [0, 0.05, 0.24],
  flight: [0.08, 0.36],
  impact: [0.36, 0.44, 0.85],
} as const;

const clamp = { extrapolateLeft: Extrapolation.CLAMP, extrapolateRight: Extrapolation.CLAMP };

export const CombatFx: React.FC<Props> = ({ state }) => {
  const reducedMotion = useReducedMotion();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [fx, setFx] = useState<TurnFx | null>(null);
  const previous = useRef(state);
  const progress = useSharedValue(1);
  const hapticTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (hapticTimer.current) clearTimeout(hapticTimer.current);
  }, []);

  useEffect(() => {
    const before = previous.current;
    previous.current = state;
    // A new match (round back to 0) clears whatever was on screen.
    if (state.round === 0) {
      setFx(null);
      return;
    }
    if (state.round <= before.round) return;

    const turn: TurnFx = {
      round: state.round,
      playerAction: state.lastPlayerAction,
      opponentAction: state.lastOpponentAction,
      playerHit: state.player.lives < before.player.lives,
      opponentHit: state.opponent.lives < before.opponent.lives,
    };
    setFx(turn);

    cancelAnimation(progress);
    progress.value = 0;
    progress.value = withTiming(1, { duration: MOTION.combat, easing: Easing.linear });

    // Haptics land with the impact, not with the start of the animation.
    const impactAt = MOTION.combat * T.impact[0];
    if (hapticTimer.current) clearTimeout(hapticTimer.current);
    hapticTimer.current = setTimeout(() => {
      if (turn.playerHit) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      } else if (turn.opponentHit) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
      } else if (turn.playerAction === 'shoot' || turn.opponentAction === 'shoot') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
    }, impactAt);
  }, [state, progress]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
  };

  const ready = fx !== null && size.height > 0 && !reducedMotion;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" onLayout={onLayout}>
      {ready && (
        <>
          <HitFlash side="player" active={fx.playerHit} progress={progress} height={size.height} />
          <HitFlash side="opponent" active={fx.opponentHit} progress={progress} height={size.height} />
          <SideFx
            key={`player-${fx.round}`}
            side="player"
            action={fx.playerAction}
            hit={fx.opponentHit}
            blocked={fx.playerAction === 'shoot' && fx.opponentAction === 'shield'}
            blocks={fx.playerAction === 'shield' && fx.opponentAction === 'shoot'}
            progress={progress}
            width={size.width}
            height={size.height}
          />
          <SideFx
            key={`opponent-${fx.round}`}
            side="opponent"
            action={fx.opponentAction}
            hit={fx.playerHit}
            blocked={fx.opponentAction === 'shoot' && fx.playerAction === 'shield'}
            blocks={fx.opponentAction === 'shield' && fx.playerAction === 'shoot'}
            progress={progress}
            width={size.width}
            height={size.height}
          />
        </>
      )}
    </View>
  );
};

// ── Hit flash: the victim's half of the screen pulses red ────────────────────

const HitFlash: React.FC<{
  side: Side;
  active: boolean;
  progress: SharedValue<number>;
  height: number;
}> = ({ side, active, progress, height }) => {
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [T.impact[0], T.impact[1], 1], [0, 0.38, 0], clamp),
  }));
  if (!active) return null;
  return (
    <Animated.View
      style={[
        styles.hitFlash,
        side === 'player' ? { bottom: 0, height: height / 2 } : { top: 0, height: height / 2 },
        style,
      ]}
    />
  );
};

// ── One side's action ───────────────────────────────────────────────────────

interface SideFxProps {
  side: Side;
  action: GameAction | null;
  /** This side's shot wounded the other side. */
  hit: boolean;
  /** This side's shot was stopped by the other side's shield. */
  blocked: boolean;
  /** This side's shield stopped an incoming shot. */
  blocks: boolean;
  progress: SharedValue<number>;
  width: number;
  height: number;
}

const SideFx: React.FC<SideFxProps> = (props) => {
  if (props.action === 'shoot') return <ShotFx {...props} />;
  if (props.action === 'shield') return <ShieldFx {...props} />;
  if (props.action === 'reload') return <ReloadFx {...props} />;
  return null;
};

/** Vertical position as a fraction of the screen, mirrored for the opponent (top). */
const yFor = (side: Side, fraction: number, height: number) =>
  (side === 'player' ? fraction : 1 - fraction) * height;

const TRACER_H = 84;
const MUZZLE = 56;
const IMPACT = 72;

const ShotFx: React.FC<SideFxProps> = ({ side, hit, blocked, progress, width, height }) => {
  const color = SIDE_COLOR[side];
  const originY = yFor(side, 0.66, height);
  // A blocked shot dies on the barrier; otherwise it reaches the target.
  const endY = yFor(side, blocked ? 0.38 : 0.27, height);
  const cx = width / 2;

  const muzzleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [...T.muzzle], [0, 1, 0], clamp),
    transform: [{ scale: interpolate(progress.value, [T.muzzle[0], T.muzzle[2]], [0.4, 1.8], clamp) }],
  }));

  const tracerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [T.flight[0], T.flight[0] + 0.02, T.flight[1], T.flight[1] + 0.05],
      [0, 1, 1, 0],
      clamp,
    ),
    transform: [
      { translateY: interpolate(progress.value, [...T.flight], [originY, endY], clamp) - TRACER_H / 2 },
    ],
  }));

  const impactStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [...T.impact], [0, 1, 0], clamp),
    transform: [{ scale: interpolate(progress.value, [T.impact[0], T.impact[2]], [0.3, hit ? 2.2 : 1.2], clamp) }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [T.impact[0], T.impact[1], 0.88, 1], [0, 1, 1, 0], clamp),
    transform: [{ translateY: interpolate(progress.value, [T.impact[0], 1], [0, side === 'player' ? -14 : 14], clamp) }],
  }));

  return (
    <>
      <Animated.View
        style={[
          styles.muzzle,
          { left: cx - MUZZLE / 2, top: originY - MUZZLE / 2, backgroundColor: color, shadowColor: color },
          muzzleStyle,
        ]}
      />
      <Animated.View
        style={[
          styles.tracer,
          { left: cx - 2, backgroundColor: color, shadowColor: color },
          tracerStyle,
        ]}
      />
      <Animated.View
        style={[
          styles.impact,
          {
            left: cx - IMPACT / 2,
            top: endY - IMPACT / 2,
            borderColor: hit ? KS.danger : SHIELD_COLOR,
            shadowColor: hit ? KS.danger : SHIELD_COLOR,
          },
          impactStyle,
        ]}
      />
      {hit && (
        <Animated.Text style={[styles.label, { top: endY - 46, color: KS.danger }, labelStyle]}>
          HIT · −1
        </Animated.Text>
      )}
    </>
  );
};

const ShieldFx: React.FC<SideFxProps> = ({ side, blocks, progress, width, height }) => {
  const y = yFor(side, 0.62, height);
  const barWidth = Math.min(width * 0.72, 300);

  const barrierStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.1, 0.72, 1], [0, 0.95, 0.95, 0], clamp),
    transform: [
      { scaleX: interpolate(progress.value, [0, 0.18], [0.35, 1], clamp) },
      // The barrier flares when the incoming shot lands on it.
      { scaleY: blocks ? interpolate(progress.value, [T.impact[0], T.impact[1], 0.62], [1, 3, 1], clamp) : 1 },
    ],
  }));

  const haloStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.14, 0.72, 1], [0, 0.22, 0.22, 0], clamp),
    transform: [{ scaleX: interpolate(progress.value, [0, 0.18], [0.35, 1], clamp) }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [T.impact[0], T.impact[1], 0.88, 1], [0, 1, 1, 0], clamp),
  }));

  return (
    <>
      <Animated.View
        style={[styles.shieldHalo, { left: (width - barWidth) / 2, width: barWidth, top: y - 22 }, haloStyle]}
      />
      <Animated.View
        style={[styles.shieldBar, { left: (width - barWidth) / 2, width: barWidth, top: y - 3 }, barrierStyle]}
      />
      {blocks && (
        <Animated.Text
          style={[styles.label, { top: y + (side === 'player' ? -34 : 14), color: SHIELD_COLOR }, labelStyle]}
        >
          BLOCKED
        </Animated.Text>
      )}
    </>
  );
};

const RING = 46;

const ReloadFx: React.FC<SideFxProps> = ({ side, progress, width, height }) => {
  const y = yFor(side, 0.66, height);
  const cx = width / 2;

  const ringStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.08, 0.62, 0.8], [0, 1, 1, 0], clamp),
    transform: [
      { rotate: `${interpolate(progress.value, [0, 0.62], [0, 360], clamp)}deg` },
      { scale: interpolate(progress.value, [0.5, 0.62, 0.8], [1, 1.25, 0.9], clamp) },
    ],
  }));

  const plusStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.4, 0.52, 0.86, 1], [0, 1, 1, 0], clamp),
    transform: [{ translateY: interpolate(progress.value, [0.4, 1], [6, -18], clamp) }],
  }));

  return (
    <>
      <Animated.View
        style={[styles.reloadRing, { left: cx - RING / 2, top: y - RING / 2 }, ringStyle]}
      />
      <Animated.Text style={[styles.label, { top: y - 10, color: KS.alert }, plusStyle]}>+1</Animated.Text>
    </>
  );
};

const glow = { shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 10, elevation: 6 };

const styles = StyleSheet.create({
  hitFlash: { position: 'absolute', left: 0, right: 0, backgroundColor: KS.danger },
  muzzle: {
    position: 'absolute',
    width: MUZZLE,
    height: MUZZLE,
    borderRadius: MUZZLE / 2,
    ...glow,
  },
  tracer: {
    position: 'absolute',
    top: 0,
    width: 4,
    height: TRACER_H,
    borderRadius: 2,
    ...glow,
  },
  impact: {
    position: 'absolute',
    width: IMPACT,
    height: IMPACT,
    borderRadius: IMPACT / 2,
    borderWidth: 3,
    ...glow,
  },
  shieldBar: {
    position: 'absolute',
    height: 6,
    borderRadius: 3,
    backgroundColor: SHIELD_COLOR,
    shadowColor: SHIELD_COLOR,
    ...glow,
  },
  shieldHalo: {
    position: 'absolute',
    height: 44,
    borderRadius: 22,
    backgroundColor: SHIELD_COLOR,
  },
  reloadRing: {
    position: 'absolute',
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    borderWidth: 3,
    borderColor: KS.alert,
    borderTopColor: 'transparent',
    shadowColor: KS.alert,
    ...glow,
  },
  label: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: TYPO.monoBold,
    fontSize: SIZES.monoLg,
    letterSpacing: SIZES.monoLg * 0.18,
  },
});
