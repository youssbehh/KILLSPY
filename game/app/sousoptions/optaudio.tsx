import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Slider } from '@rneui/themed';
import { motTraduit } from '@/components/translationHelper';
import { useLanguageStore } from '../../store/languageStore';
import { KSAccordion } from './KSAccordion';
import { KS } from '@/src/theme/colors';
import { TYPO, SIZES } from '@/src/theme/typography';

function volumeGlyph(v: number) {
  if (v === 0) return '🔇';
  if (v <= 3) return '🔈';
  if (v <= 7) return '🔉';
  return '🔊';
}

const AudioContainer = () => {
  const { langIndex } = useLanguageStore();
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
        <Pressable onPress={toggleBgm} style={styles.muteBtn}>
          <Text style={styles.glyphText}>{volumeGlyph(bgm)}</Text>
        </Pressable>
        <Text style={styles.trackLabel}>{motTraduit(langIndex, 23)}</Text>
        <Text style={styles.trackValue}>{bgm}</Text>
      </View>
      <Slider
        value={bgm}
        onValueChange={(v) => { setBgm(v); if (v !== 0) setLastBgm(v); }}
        minimumValue={0}
        maximumValue={10}
        step={1}
        allowTouchTrack
        minimumTrackTintColor={KS.primary}
        maximumTrackTintColor={KS.surfaceHi}
        thumbTintColor={KS.primary}
        style={styles.slider}
      />

      {/* SFX */}
      <View style={[styles.trackRow, { marginTop: 8 }]}>
        <Pressable onPress={toggleSfx} style={styles.muteBtn}>
          <Text style={styles.glyphText}>{volumeGlyph(sfx)}</Text>
        </Pressable>
        <Text style={styles.trackLabel}>{motTraduit(langIndex, 24)}</Text>
        <Text style={styles.trackValue}>{sfx}</Text>
      </View>
      <Slider
        value={sfx}
        onValueChange={(v) => { setSfx(v); if (v !== 0) setLastSfx(v); }}
        minimumValue={0}
        maximumValue={10}
        step={1}
        allowTouchTrack
        minimumTrackTintColor={KS.primary}
        maximumTrackTintColor={KS.surfaceHi}
        thumbTintColor={KS.primary}
        style={styles.slider}
      />
    </KSAccordion>
  );
};

const styles = StyleSheet.create({
  trackRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  muteBtn: { width: 28, alignItems: 'center' },
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
  slider: { width: '100%', height: 36 },
});

export default AudioContainer;
