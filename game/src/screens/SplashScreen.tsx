import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  Animated as RNAnimated,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { KS } from '../theme/colors';
import { TYPO, SIZES } from '../theme/typography';
import { MOTION } from '../theme/motion';
import { TopoBg } from '../components/ks/TopoBg';
import { Logo } from '../components/ks/Logo';
import { ProgressBar } from '../components/ks/ProgressBar';

export const SplashScreen: React.FC = () => {
  const { width, height } = useWindowDimensions();
  const router = useRouter();

  // Simulate loading progress
  const [progress, setProgress] = React.useState(0);
  const [status, setStatus] = React.useState('INITIALIZING SYSTEMS');

  const stampScale = useSharedValue(2.2);
  const stampRotate = useSharedValue(-14);
  const stampOpacity = useSharedValue(0);

  const blinkOpacity = useSharedValue(1);

  useEffect(() => {
    // Blink animation for "CLEARANCE 4"
    blinkOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: MOTION.blinkFast }),
        withTiming(1, { duration: MOTION.blinkFast }),
      ),
      -1,
      false,
    );

    // Simulate loading
    const steps = [
      { pct: 0.15, label: 'DECRYPTING MAP' },
      { pct: 0.35, label: 'LOADING ASSETS' },
      { pct: 0.55, label: 'SYNCING INTEL' },
      { pct: 0.75, label: 'ARMING SYSTEMS' },
      { pct: 0.92, label: 'ESTABLISHING CHANNEL' },
      { pct: 1.00, label: 'MISSION READY' },
    ];

    let idx = 0;
    const interval = setInterval(() => {
      if (idx < steps.length) {
        setProgress(steps[idx].pct);
        setStatus(steps[idx].label);
        idx++;
      } else {
        clearInterval(interval);
      }
    }, 380);

    // Stamp animation — starts after logo letters finish
    const logoDelay = 8 * MOTION.letterStagger + MOTION.letterIn + 100;
    setTimeout(() => {
      stampOpacity.value = withTiming(1, { duration: 100 });
      stampScale.value = withTiming(1, { duration: MOTION.stampIn, easing: Easing.out(Easing.back(1.5)) });
      stampRotate.value = withTiming(-6, { duration: MOTION.stampIn, easing: Easing.out(Easing.back(1.5)) });
    }, logoDelay);

    // Navigate when done
    const navTimer = setTimeout(() => {
      router.replace('/(tabs)/gamechoice');
    }, 2800);

    return () => {
      clearInterval(interval);
      clearTimeout(navTimer);
    };
  }, []);

  const stampStyle = useAnimatedStyle(() => ({
    opacity: stampOpacity.value,
    transform: [
      { scale: stampScale.value },
      { rotate: `${stampRotate.value}deg` },
    ],
  }));

  const blinkStyle = useAnimatedStyle(() => ({
    opacity: blinkOpacity.value,
  }));

  return (
    <View style={[styles.container, { width, height }]}>
      <TopoBg showRadar radarDuration={MOTION.radarSlow} intensity={1.2} />

      {/* Top eyebrow row */}
      <View style={[styles.topRow, { top: 70, width: width - 32 }]}>
        <Text style={styles.eyebrow}>DOSSIER · B-2747</Text>
        <Animated.View style={[styles.row, blinkStyle]}>
          <Text style={[styles.eyebrow, { color: KS.live }]}>● CLEARANCE 4</Text>
        </Animated.View>
      </View>

      {/* Center logo block */}
      <View style={styles.centerBlock}>
        <Text style={styles.presenter}>// MIMIR STUDIO PRESENTS</Text>

        <Logo size={SIZES.logoXL} animated color={KS.ink} />

        <Text style={styles.classified}>[ CLASSIFIED · INTEL ]</Text>

        {/* TOP SECRET stamp */}
        <Animated.View style={[styles.topSecret, stampStyle]}>
          <Text style={styles.topSecretText}>TOP SECRET</Text>
        </Animated.View>
      </View>

      {/* Bottom — loading bar */}
      <View style={[styles.bottomBlock, { width: width - 32 }]}>
        <View style={styles.loadRow}>
          <Text style={styles.loadLabel}>// LOADING MISSION ASSETS</Text>
          <Text style={[styles.loadLabel, { color: KS.primary }]}>
            {Math.round(progress * 100)}%
          </Text>
        </View>
        <ProgressBar value={progress} segments={28} color={KS.live} height={10} />
        <View style={styles.statusRow}>
          <Text style={styles.statusText}>✓ NEURAL LINK ✓ CRYPTO</Text>
          <Animated.Text style={[styles.statusText, { color: KS.alert }, blinkStyle]}>
            › {status}
          </Animated.Text>
        </View>
      </View>

      {/* Footer */}
      <Text style={[styles.footer, { bottom: 28 }]}>
        MIMIR STUDIO · v1.0.26 · BUILD 0524
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: KS.bg,
  },
  topRow: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyebrow: {
    color: KS.inkDim,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoSm,
    letterSpacing: SIZES.monoSm * 0.18,
  },
  centerBlock: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 60,
  },
  presenter: {
    color: KS.inkDim,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoMd,
    letterSpacing: SIZES.monoMd * 0.18,
    marginBottom: 8,
  },
  classified: {
    color: KS.inkMute,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoSm,
    letterSpacing: SIZES.monoSm * 0.32,
    marginTop: 4,
  },
  topSecret: {
    borderWidth: 2,
    borderColor: KS.alert,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginTop: 8,
    shadowColor: KS.alert,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
    elevation: 6,
  },
  topSecretText: {
    color: KS.alert,
    fontFamily: TYPO.display,
    fontSize: SIZES.titleLg,
    letterSpacing: SIZES.titleLg * 0.06,
  },
  bottomBlock: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    gap: 6,
  },
  loadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  loadLabel: {
    color: KS.inkDim,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoSm,
    letterSpacing: SIZES.monoSm * 0.18,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  statusText: {
    color: KS.inkFaint,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoXs,
    letterSpacing: SIZES.monoXs * 0.18,
  },
  footer: {
    position: 'absolute',
    color: KS.inkFaint,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoXxs,
    letterSpacing: SIZES.monoXxs * 0.18,
    alignSelf: 'center',
  },
});
