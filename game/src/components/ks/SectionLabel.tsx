import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { KS } from '../../theme/colors';
import { TYPO, SIZES } from '../../theme/typography';

interface Props {
  label: string;
  color?: string;
}

export const SectionLabel: React.FC<Props> = ({ label, color = KS.primary }) => (
  <View style={styles.row}>
    <View style={[styles.line, { backgroundColor: color }]} />
    <Text style={[styles.text, { color }]}>
      {`[ ${label.toUpperCase()} ]`}
    </Text>
    <View style={[styles.lineFade, { backgroundColor: color }]} />
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  line: {
    width: 14,
    height: 1,
    opacity: 0.6,
  },
  lineFade: {
    flex: 1,
    height: 1,
    opacity: 0.15,
  },
  text: {
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoXs,
    letterSpacing: SIZES.monoXs * 0.32,
  },
});
