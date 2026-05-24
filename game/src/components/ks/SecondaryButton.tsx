import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { KS } from '../../theme/colors';
import { TYPO, SIZES } from '../../theme/typography';
import { MOTION } from '../../theme/motion';

interface Props {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const SecondaryButton: React.FC<Props> = ({ label, onPress, disabled, style }) => {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[{ borderRadius: 26, overflow: 'hidden' }, animStyle, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => { scale.value = withTiming(0.96, { duration: MOTION.tap }); }}
        onPressOut={() => { scale.value = withTiming(1, { duration: MOTION.tap }); }}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        android_ripple={{ color: 'rgba(255,193,7,0.2)' }}
        style={[styles.btn, { opacity: disabled ? 0.5 : 1 }]}
      >
        <Text style={styles.label}>{label.toUpperCase()}</Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  btn: {
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: KS.alert,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  label: {
    color: KS.alert,
    fontFamily: TYPO.display,
    fontSize: SIZES.titleSm,
    letterSpacing: SIZES.titleSm * 0.06,
  },
});
