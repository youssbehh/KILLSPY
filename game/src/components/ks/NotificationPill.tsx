import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { KS } from '../../theme/colors';
import { TYPO, SIZES } from '../../theme/typography';

interface Props {
  count: number;
}

export const NotificationPill: React.FC<Props> = ({ count }) => (
  <View style={styles.container}>
    <View style={styles.dot} />
    <Text style={styles.text}>{count}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: KS.surface,
    borderWidth: 1,
    borderColor: KS.hairSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: KS.live,
    shadowColor: KS.live,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 3,
  },
  text: {
    color: KS.ink,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoSm,
  },
});
