import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../stores/themeStore';
import { radius, spacing } from '../theme/tokens';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'highlighted';
}

export const Card: React.FC<CardProps> = ({ children, style, variant = 'default' }) => {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: variant === 'highlighted' ? theme.colors.surfaceAlt : theme.colors.surface,
          borderColor: theme.colors.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
});
