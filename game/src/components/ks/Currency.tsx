import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { KS } from '../../theme/colors';
import { TYPO, SIZES } from '../../theme/typography';

interface Props {
  kind: 'coin' | 'gem';
  value: number;
}

export const Currency: React.FC<Props> = ({ kind, value }) => {
  const glyph = kind === 'coin' ? '◈' : '✦';
  const glyphColor = kind === 'coin' ? KS.alert : KS.live;

  return (
    <View style={styles.container}>
      <Text style={[styles.glyph, { color: glyphColor }]}>{glyph}</Text>
      <Text style={styles.value}>
        {value.toLocaleString('en-US')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: KS.hairSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  glyph: {
    fontFamily: TYPO.monoBold,
    fontSize: SIZES.monoMd,
  },
  value: {
    color: KS.ink,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoMd,
  },
});
