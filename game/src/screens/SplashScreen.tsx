import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  Animated as RNAnimated,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
  runOnJS,
  useReducedMotion,
} from 'react-native-reanimated';
import { appVersion } from '../../config';
import { KS } from '../theme/colors';
import { TYPO, SIZES } from '../theme/typography';
import { MOTION } from '../theme/motion';
import { TopoBg } from '../components/ks/TopoBg';
import { Logo } from '../components/ks/Logo';
import { ProgressBar } from '../components/ks/ProgressBar';
import { useLocalT } from '../i18n/local';

const STRINGS = {
  fr: {
    init: 'INITIALISATION DES SYSTÈMES',
    decrypting: 'DÉCHIFFREMENT DE LA CARTE',
    loadingAssets: 'CHARGEMENT DES RESSOURCES',
    syncing: 'SYNCHRO DES RENSEIGNEMENTS',
    arming: 'ARMEMENT DES SYSTÈMES',
    channel: 'OUVERTURE DU CANAL',
    ready: 'MISSION PRÊTE',
    dossier: 'DOSSIER · B-2747',
    clearance: '● HABILITATION 4',
    presents: '// MIMIR STUDIO PRÉSENTE',
    classified: '[ CLASSIFIÉ · RENSEIGNEMENT ]',
    topSecret: 'TOP SECRET',
    loadingMission: '// CHARGEMENT DES RESSOURCES DE MISSION',
    links: '✓ LIEN NEURAL ✓ CRYPTO',
    skip: "Passer l'introduction",
  },
  en: {
    init: 'INITIALIZING SYSTEMS',
    decrypting: 'DECRYPTING MAP',
    loadingAssets: 'LOADING ASSETS',
    syncing: 'SYNCING INTEL',
    arming: 'ARMING SYSTEMS',
    channel: 'ESTABLISHING CHANNEL',
    ready: 'MISSION READY',
    dossier: 'FILE · B-2747',
    clearance: '● CLEARANCE 4',
    presents: '// MIMIR STUDIO PRESENTS',
    classified: '[ CLASSIFIED · INTEL ]',
    topSecret: 'TOP SECRET',
    loadingMission: '// LOADING MISSION ASSETS',
    links: '✓ NEURAL LINK ✓ CRYPTO',
    skip: 'Skip the intro',
  },
} as const;

type SplashKey = keyof typeof STRINGS.fr;

/** How long the intro plays (the stamp lands, then the progress bar fills). */
export const SPLASH_DURATION_MS = 2800;

/**
 * Animated intro shown over the app at every cold start, while the session is
 * restored behind it. Tap anywhere to skip; with reduced motion it is short.
 */
export const SplashScreen: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const { width, height } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const done = React.useRef(false);
  const finish = React.useCallback(() => {
    if (done.current) return;
    done.current = true;
    onDone();
  }, [onDone]);
  const t = useLocalT(STRINGS);

  // Simulate loading progress
  const [progress, setProgress] = React.useState(0);
  const [status, setStatus] = React.useState<SplashKey>('init');

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
    const steps: { pct: number; label: SplashKey }[] = [
      { pct: 0.15, label: 'decrypting' },
      { pct: 0.35, label: 'loadingAssets' },
      { pct: 0.55, label: 'syncing' },
      { pct: 0.75, label: 'arming' },
      { pct: 0.92, label: 'channel' },
      { pct: 1.00, label: 'ready' },
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

    const navTimer = setTimeout(finish, reducedMotion ? 900 : SPLASH_DURATION_MS);

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
    <Pressable
      style={[styles.container, { width, height }]}
      onPress={finish}
      accessibilityRole="button"
      accessibilityLabel={t('skip')}
    >
      <TopoBg showRadar radarDuration={MOTION.radarSlow} intensity={1.2} />

      {/* Top eyebrow row */}
      <View style={[styles.topRow, { top: 70, width: Math.max(0, width - 32) }]}>
        <Text style={styles.eyebrow}>{t('dossier')}</Text>
        <Animated.View style={[styles.row, blinkStyle]}>
          <Text style={[styles.eyebrow, { color: KS.live }]}>{t('clearance')}</Text>
        </Animated.View>
      </View>

      {/* Center logo block */}
      <View style={styles.centerBlock}>
        <Text style={styles.presenter}>{t('presents')}</Text>

        <Logo size={SIZES.logoXL} animated color={KS.ink} />

        <Text style={styles.classified}>{t('classified')}</Text>

        {/* TOP SECRET stamp */}
        <Animated.View style={[styles.topSecret, stampStyle]}>
          <Text style={styles.topSecretText}>{t('topSecret')}</Text>
        </Animated.View>
      </View>

      {/* Bottom — loading bar */}
      <View style={[styles.bottomBlock, { width: Math.max(0, width - 32) }]}>
        <View style={styles.loadRow}>
          <Text style={styles.loadLabel}>{t('loadingMission')}</Text>
          <Text style={[styles.loadLabel, { color: KS.primary }]}>
            {Math.round(progress * 100)}%
          </Text>
        </View>
        <ProgressBar value={progress} segments={28} color={KS.live} height={10} />
        <View style={styles.statusRow}>
          <Text style={styles.statusText}>{t('links')}</Text>
          <Animated.Text style={[styles.statusText, { color: KS.alert }, blinkStyle]}>
            › {t(status)}
          </Animated.Text>
        </View>
      </View>

      {/* Footer */}
      <Text style={[styles.footer, { bottom: 28 }]}>
        MIMIR STUDIO · v{appVersion}
      </Text>
    </Pressable>
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
