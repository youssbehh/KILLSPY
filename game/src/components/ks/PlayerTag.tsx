import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { HexAvatar } from './HexAvatar';
import { RankBadge } from './RankBadge';
import { KS, TierName } from '../../theme/colors';
import { TYPO, SIZES } from '../../theme/typography';

interface Props {
  username: string;
  tier: 0 | 1 | 2 | 3 | 4;
  live?: boolean;
  src?: string;
  winRate?: number;
  kd?: number;
  size?: 'normal' | 'big';
}

export const PlayerTag: React.FC<Props> = ({
  username,
  tier,
  live = false,
  src,
  winRate,
  kd,
  size = 'normal',
}) => {
  const avatarSize = size === 'big' ? 48 : 36;
  const nameSize = size === 'big' ? SIZES.titleSm : SIZES.labelLg;

  return (
    <View style={styles.row}>
      <HexAvatar size={avatarSize} tier={['bronze','silver','gold','diamond','phantom'][tier] as TierName} src={src} live={live} />
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { fontSize: nameSize }]}>{username}</Text>
          <RankBadge tier={tier} size={18} />
        </View>
        {(winRate !== undefined || kd !== undefined) && (
          <Text style={styles.stats}>
            {winRate !== undefined && `WR ${winRate}%`}
            {winRate !== undefined && kd !== undefined && ' · '}
            {kd !== undefined && `K/D ${kd.toFixed(1)}`}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  info: {
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  name: {
    color: KS.ink,
    fontFamily: TYPO.display,
    letterSpacing: SIZES.titleSm * 0.04,
  },
  stats: {
    color: KS.inkDim,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoXs,
    letterSpacing: SIZES.monoXs * 0.18,
  },
});
