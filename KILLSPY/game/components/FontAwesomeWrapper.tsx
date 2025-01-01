import React from 'react';
import { Platform } from 'react-native';
import { FontAwesomeIcon as WebIcon } from '@fortawesome/react-fontawesome';
import { FontAwesomeIcon as NativeIcon } from '@fortawesome/react-native-fontawesome';
import { IconDefinition, SizeProp } from '@fortawesome/fontawesome-svg-core';

interface FontAwesomeWrapperProps {
  icon: IconDefinition;
  color?: string;
  size?: number;
}

export const FontAwesomeWrapper: React.FC<FontAwesomeWrapperProps> = ({ icon, color, size }) => {
  if (Platform.OS === 'web') {
    return <WebIcon icon={icon} color={color} size={(size?.toString() || 'lg') as SizeProp} />;
  }
  return <NativeIcon icon={icon} color={color} size={size} />;
};