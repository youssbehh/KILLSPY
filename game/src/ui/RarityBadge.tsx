import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RarityId, RARITIES } from '../game/rarities';

interface Props {
  rarity: RarityId;
  small?: boolean;
}

export const RarityBadge: React.FC<Props> = ({ rarity, small }) => {
  const r = RARITIES[rarity];
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: r.color, borderColor: r.glow },
        small && styles.small,
      ]}
    >
      <Text style={[styles.text, small && styles.textSmall]}>{r.label}</Text>
      {rarity === 'secret' ? <Text style={styles.star}>✦</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  small: { paddingHorizontal: 6, paddingVertical: 2 },
  text: { color: 'white', fontSize: 11, fontWeight: '700' },
  textSmall: { fontSize: 9 },
  star: { color: 'white', fontSize: 10 },
});
