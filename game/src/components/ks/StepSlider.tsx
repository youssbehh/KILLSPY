import React, { useRef } from 'react';
import { GestureResponderEvent, LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { KS } from '@/src/theme/colors';

interface StepSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  /** Read by screen readers, e.g. "Music volume". */
  accessibilityLabel: string;
}

/**
 * Whole-number slider (0–10 by default): tap or drag anywhere on the track.
 * Screen readers get an "adjustable" control that steps with swipe up / down.
 */
export const StepSlider = ({ value, onValueChange, min = 0, max = 10, accessibilityLabel }: StepSliderProps) => {
  const width = useRef(0);
  const steps = max - min;

  const valueAt = (x: number) => {
    if (width.current <= 0) return value;
    const ratio = Math.min(1, Math.max(0, x / width.current));
    return min + Math.round(ratio * steps);
  };

  const onTouch = (e: GestureResponderEvent) => {
    const next = valueAt(e.nativeEvent.locationX);
    if (next !== value) onValueChange(next);
  };

  const fill = steps > 0 ? (value - min) / steps : 0;

  return (
    <View
      style={styles.hitArea}
      onLayout={(e: LayoutChangeEvent) => { width.current = e.nativeEvent.layout.width; }}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={onTouch}
      onResponderMove={onTouch}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min, max, now: value }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === 'increment') onValueChange(Math.min(max, value + 1));
        if (e.nativeEvent.actionName === 'decrement') onValueChange(Math.max(min, value - 1));
      }}
      testID="step-slider"
    >
      <View style={styles.track} pointerEvents="none">
        <View style={[styles.fill, { width: `${fill * 100}%` }]} />
      </View>
      <View style={[styles.thumb, { left: `${fill * 100}%` }]} pointerEvents="none" />
    </View>
  );
};

const THUMB = 18;

const styles = StyleSheet.create({
  // 44 px tall so the whole control is an easy touch target.
  hitArea: { height: 44, justifyContent: 'center', marginHorizontal: THUMB / 2 },
  track: { height: 4, borderRadius: 2, backgroundColor: KS.surfaceHi, overflow: 'hidden' },
  fill: { height: 4, backgroundColor: KS.primary },
  thumb: {
    position: 'absolute',
    width: THUMB,
    height: THUMB,
    marginLeft: -THUMB / 2,
    borderRadius: THUMB / 2,
    backgroundColor: KS.primary,
  },
});
