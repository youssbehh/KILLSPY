import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { KS } from '../../theme/colors';
import { TYPO, SIZES } from '../../theme/typography';

interface Props {
  value: number;      // 0..1
  segments?: number;
  label?: string;
  sublabel?: string;
  color?: string;
  height?: number;
}

export const ProgressBar: React.FC<Props> = ({
  value,
  segments = 24,
  label,
  sublabel,
  color = KS.live,
  height = 10,
}) => {
  const progress = useSharedValue(value);

  useEffect(() => {
    progress.value = withTiming(value, {
      duration: 400,
      easing: Easing.out(Easing.cubic),
    });
  }, [value]);

  const filledCount = Math.round(value * segments);

  return (
    <View>
      {(label || sublabel) && (
        <View style={styles.labelRow}>
          {label && (
            <Text style={styles.label}>{label}</Text>
          )}
          {sublabel && (
            <Text style={styles.sublabel}>{sublabel}</Text>
          )}
        </View>
      )}
      <View style={[styles.track, { height }]}>
        {Array.from({ length: segments }).map((_, i) => {
          const filled = i < filledCount;
          return (
            <View
              key={i}
              style={[
                styles.segment,
                {
                  height,
                  backgroundColor: filled ? color : KS.hairSoft,
                  shadowColor: filled ? color : 'transparent',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: filled ? 1 : 0,
                  shadowRadius: 3,
                  elevation: filled ? 2 : 0,
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    color: KS.inkDim,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoSm,
    letterSpacing: SIZES.monoSm * 0.18,
  },
  sublabel: {
    color: KS.inkMute,
    fontFamily: TYPO.monoBold,
    fontSize: SIZES.monoSm,
  },
  track: {
    flexDirection: 'row',
    gap: 2,
    padding: 2,
    backgroundColor: KS.surface,
    borderRadius: 2,
  },
  segment: {
    flex: 1,
    borderRadius: 1,
  },
});
