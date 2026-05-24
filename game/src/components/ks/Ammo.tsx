import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { KS } from '../../theme/colors';
import { TYPO, SIZES } from '../../theme/typography';

interface Props {
  current: number;
  max?: number;
  color?: string;
}

export const Ammo: React.FC<Props> = ({ current, max = 6, color = KS.primary }) => (
  <View style={styles.container}>
    <View style={styles.pips}>
      {Array.from({ length: max }).map((_, i) => {
        const active = i < current;
        return (
          <View
            key={i}
            style={[
              styles.pip,
              {
                backgroundColor: active ? color : 'rgba(255,255,255,0.08)',
                shadowColor: active ? color : 'transparent',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: active ? 0.8 : 0,
                shadowRadius: 2,
                elevation: active ? 2 : 0,
              },
            ]}
          />
        );
      })}
    </View>
    <Text style={[styles.count, { color }]}>{current}/{max}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: KS.surface,
    borderWidth: 1,
    borderColor: KS.hairSoft,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  pips: { flexDirection: 'row', gap: 3, alignItems: 'center' },
  pip: { width: 3, height: 14, borderRadius: 1.5 },
  count: {
    fontFamily: TYPO.monoBold,
    fontSize: SIZES.monoSm,
  },
});
