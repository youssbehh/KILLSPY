import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { StepSlider } from '@/src/components/ks/StepSlider';
import { motTraduit } from '@/components/translationHelper';
import { useLanguageStore } from '@/src/stores/languageStore';
import { KSAccordion } from './KSAccordion';
import { KS } from '@/src/theme/colors';
import { TYPO, SIZES } from '@/src/theme/typography';
import { useLocalT } from '@/src/i18n/local';

const STRINGS = {
  fr: { mute: 'Couper : {track}', unmute: 'Rétablir : {track}' },
  en: { mute: 'Mute: {track}', unmute: 'Unmute: {track}' },
} as const;

function volumeGlyph(v: number) {
  if (v === 0) return '🔇';
  if (v <= 3) return '🔈';
  if (v <= 7) return '🔉';
  return '🔊';
}

const AudioContainer = () => {
  const { langIndex } = useLanguageStore();
  const t = useLocalT(STRINGS);
  const muteLabel = (value: number, track: string) => t(value === 0 ? 'unmute' : 'mute', { track });
  const [bgm, setBgm] = useState(7);
  const [sfx, setSfx] = useState(8);
  const [lastBgm, setLastBgm] = useState(7);
  const [lastSfx, setLastSfx] = useState(8);

  const toggleBgm = () => {
    if (bgm === 0) { setBgm(lastBgm); } else { setLastBgm(bgm); setBgm(0); }
  };
  const toggleSfx = () => {
    if (sfx === 0) { setSfx(lastSfx); } else { setLastSfx(sfx); setSfx(0); }
  };

  return (
    <KSAccordion title={motTraduit(langIndex, 19)}>
      {/* BGM */}
      <View style={styles.trackRow}>
        <Pressable
          onPress={toggleBgm}
          style={styles.muteBtn}
          accessibilityRole="button"
          accessibilityLabel={muteLabel(bgm, motTraduit(langIndex, 23))}
        >
          <Text style={styles.glyphText}>{volumeGlyph(bgm)}</Text>
        </Pressable>
        <Text style={styles.trackLabel}>{motTraduit(langIndex, 23)}</Text>
        <Text style={styles.trackValue}>{bgm}</Text>
      </View>
      <StepSlider
        value={bgm}
        onValueChange={(v) => { setBgm(v); if (v !== 0) setLastBgm(v); }}
        accessibilityLabel={motTraduit(langIndex, 23)}
      />

      {/* SFX */}
      <View style={[styles.trackRow, { marginTop: 8 }]}>
        <Pressable
          onPress={toggleSfx}
          style={styles.muteBtn}
          accessibilityRole="button"
          accessibilityLabel={muteLabel(sfx, motTraduit(langIndex, 24))}
        >
          <Text style={styles.glyphText}>{volumeGlyph(sfx)}</Text>
        </Pressable>
        <Text style={styles.trackLabel}>{motTraduit(langIndex, 24)}</Text>
        <Text style={styles.trackValue}>{sfx}</Text>
      </View>
      <StepSlider
        value={sfx}
        onValueChange={(v) => { setSfx(v); if (v !== 0) setLastSfx(v); }}
        accessibilityLabel={motTraduit(langIndex, 24)}
      />
    </KSAccordion>
  );
};

const styles = StyleSheet.create({
  trackRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  // 44 × 44: comfortable touch target for an icon-only button.
  muteBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  glyphText: { fontSize: 18 },
  trackLabel: {
    flex: 1,
    color: KS.inkDim,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoSm,
    letterSpacing: SIZES.monoSm * 0.14,
  },
  trackValue: {
    color: KS.primary,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoSm,
    minWidth: 16,
    textAlign: 'right',
  },
});

export default AudioContainer;
