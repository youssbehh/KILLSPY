import React, { useEffect, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Path, Rect, Polygon, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { ChamferContainer } from './ChamferContainer';
import { KS } from '../../theme/colors';
import { TYPO, SIZES } from '../../theme/typography';
import { MOTION } from '../../theme/motion';

export type CardAction = 'fire' | 'reload' | 'shield';

interface Props {
  action: CardAction;
  faceUp?: boolean;       // false = face-down (opponent)
  selected?: boolean;
  disabled?: boolean;     // FIRE when ammo=0
  onPress?: () => void;
}

const CARD_W = 96;
const CARD_H = 128;
const CHAMFER = 10;

const ACTION_META: Record<CardAction, {
  label: string;
  caption: string;
  iconPath: string;
}> = {
  fire: {
    label: 'FIRE',
    caption: 'COST 1 AMMO',
    // Bullet icon
    iconPath: 'M12,6 L14,6 L15,8 L15,18 L9,18 L9,8 L10,6 Z M10,4 Q12,2 14,4 L14,6 L10,6 Z',
  },
  reload: {
    label: 'RELOAD',
    caption: '+1 AMMO',
    // Circular arrow
    iconPath: 'M12,5 A7,7 0 1,1 5,12 M5,12 L3,9 M5,12 L8,10',
  },
  shield: {
    label: 'SHIELD',
    caption: 'BLOCK FIRE',
    // Shield outline
    iconPath: 'M12,3 L20,7 L20,13 Q20,18 12,21 Q4,18 4,13 L4,7 Z',
  },
};

export const ActionCard: React.FC<Props> = ({
  action,
  faceUp = true,
  selected = false,
  disabled = false,
  onPress,
}) => {
  const scale = useSharedValue(selected ? 1.02 : 1);
  const glowOp = useSharedValue(selected ? 0.5 : 0);

  useEffect(() => {
    if (selected) {
      scale.value = withTiming(1.02, { duration: MOTION.tap });
      glowOp.value = withRepeat(
        withSequence(
          withTiming(1,   { duration: MOTION.glowPulse / 2, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.4, { duration: MOTION.glowPulse / 2, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      );
    } else {
      scale.value = withTiming(1, { duration: MOTION.tap });
      glowOp.value = withTiming(0, { duration: 150 });
    }
  }, [selected]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled ? 0.45 : 1,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: glowOp.value,
  }));

  const meta = ACTION_META[action];

  const faceUpFill: [string, string, string] = ['#ffd84a', '#ffc107', '#c79504'];
  const faceDownFill: [string, string, string] = ['#c89205', '#8a6404', '#5a4202'];

  return (
    <Animated.View
      style={[
        {
          shadowColor: selected ? KS.primary : 'transparent',
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: 12,
          elevation: selected ? 8 : 0,
        },
        glowStyle,
      ]}
    >
      <Animated.View style={cardStyle}>
        <Pressable onPress={onPress} disabled={!onPress || disabled}>
          <ChamferContainer
            width={CARD_W}
            height={CARD_H}
            chamfer={CHAMFER}
            variant="tr-bl"
            fill="transparent"
            stroke={selected ? KS.primary : KS.hair}
            strokeWidth={selected ? 2 : 1}
          >
            {/* Card gradient background */}
            <Svg
              width={CARD_W}
              height={CARD_H}
              style={StyleSheet.absoluteFill}
            >
              <Defs>
                <LinearGradient
                  id={faceUp ? `face-${action}` : 'face-down'}
                  x1="0.2" y1="0" x2="0.8" y2="1"
                >
                  {(faceUp ? faceUpFill : faceDownFill).map((c, i) => (
                    <Stop key={i} offset={`${i * 50}%`} stopColor={c} />
                  ))}
                </LinearGradient>
                {/* Diagonal hatch for face-down */}
                {!faceUp && (
                  <pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse">
                    <path d="M-1,1 l2,-2 M0,8 l8,-8 M7,9 l2,-2"
                      stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" />
                  </pattern>
                )}
              </Defs>
              <Polygon
                points={`${CHAMFER},0 ${CARD_W - CHAMFER},0 ${CARD_W},${CHAMFER} ${CARD_W},${CARD_H} ${CHAMFER},${CARD_H} 0,${CARD_H - CHAMFER} 0,0`}
                fill={faceUp ? `url(#face-${action})` : 'url(#face-down)'}
              />
              {!faceUp && (
                <Polygon
                  points={`${CHAMFER},0 ${CARD_W - CHAMFER},0 ${CARD_W},${CHAMFER} ${CARD_W},${CARD_H} ${CHAMFER},${CARD_H} 0,${CARD_H - CHAMFER} 0,0`}
                  fill="url(#hatch)"
                />
              )}
            </Svg>

            {/* Corner ticks */}
            <CornerTick position="tl" />
            <CornerTick position="br" />

            {/* Card content */}
            <View style={styles.content}>
              {faceUp ? (
                <>
                  {/* Action icon */}
                  <Svg width={40} height={40} viewBox="0 0 24 24">
                    <Path
                      d={meta.iconPath}
                      stroke="rgba(0,0,0,0.8)"
                      strokeWidth={1.5}
                      fill="rgba(0,0,0,0.15)"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                  <Text style={styles.label}>{meta.label}</Text>
                  <Text style={styles.caption}>{meta.caption}</Text>
                  {selected && (
                    <View style={styles.locked}>
                      <Text style={styles.lockedText}>LOCKED</Text>
                    </View>
                  )}
                  {disabled && (
                    <View style={[StyleSheet.absoluteFill, styles.disabledOverlay]}>
                      <Text style={styles.disabledGlyph}>⊘</Text>
                    </View>
                  )}
                </>
              ) : (
                <>
                  <Text style={styles.questionMark}>?</Text>
                  <Text style={styles.classified}>CLASSIFIED</Text>
                </>
              )}
            </View>
          </ChamferContainer>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
};

const CornerTick: React.FC<{ position: 'tl' | 'br' }> = ({ position }) => (
  <View
    style={[
      styles.tick,
      position === 'tl'
        ? { top: 6, left: 6 }
        : { bottom: 6, right: 6, transform: [{ rotate: '180deg' }] },
    ]}
  >
    <View style={styles.tickH} />
    <View style={styles.tickV} />
  </View>
);

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: 8,
  },
  label: {
    color: 'rgba(0,0,0,0.85)',
    fontFamily: TYPO.display,
    fontSize: SIZES.bodyLg,
    letterSpacing: SIZES.bodyLg * 0.04,
  },
  caption: {
    color: 'rgba(0,0,0,0.55)',
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoXxs,
    letterSpacing: SIZES.monoXxs * 0.18,
  },
  locked: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,123,255,0.2)',
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  lockedText: {
    color: KS.primary,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoXxs,
    letterSpacing: SIZES.monoXxs * 0.18,
  },
  questionMark: {
    color: 'rgba(0,0,0,0.5)',
    fontFamily: TYPO.display,
    fontSize: 48,
    lineHeight: 52,
  },
  classified: {
    color: 'rgba(0,0,0,0.4)',
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoXxs,
    letterSpacing: SIZES.monoXxs * 0.32,
  },
  disabledOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  disabledGlyph: {
    color: KS.danger,
    fontSize: 28,
  },
  tick: {
    position: 'absolute',
    width: 10,
    height: 10,
  },
  tickH: {
    position: 'absolute',
    width: 10,
    height: 1.5,
    backgroundColor: 'rgba(0,0,0,0.35)',
    top: 0,
    left: 0,
  },
  tickV: {
    position: 'absolute',
    width: 1.5,
    height: 10,
    backgroundColor: 'rgba(0,0,0,0.35)',
    top: 0,
    left: 0,
  },
});
