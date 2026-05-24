import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { ChamferContainer, ChamferVariant } from './ChamferContainer';
import { KS } from '../../theme/colors';

interface Props {
  width: number;
  height: number;
  chamfer?: number;
  variant?: ChamferVariant;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
}

export const GlassCard: React.FC<Props> = ({
  width,
  height,
  chamfer = 10,
  variant = 'tr-bl',
  children,
  style,
  intensity = 20,
}) => {
  return (
    <View style={[{ width, height, overflow: 'hidden' }, style]}>
      {/* Blur layer — clipped by chamfer shape */}
      <View style={{ position: 'absolute', inset: 0, borderRadius: 2 }}>
        <BlurView intensity={intensity} tint="dark" style={{ flex: 1 }} />
      </View>
      <ChamferContainer
        width={width}
        height={height}
        chamfer={chamfer}
        variant={variant}
        fill={KS.glass}
        stroke={KS.hair}
        strokeWidth={1}
      >
        {children}
      </ChamferContainer>
    </View>
  );
};
