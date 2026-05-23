import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import { useTheme } from '../stores/themeStore';
import { fontSize, fontWeight } from '../theme/tokens';

type Variant = 'body' | 'muted' | 'h1' | 'h2' | 'h3' | 'caption';

interface ThemedTextProps extends TextProps {
  variant?: Variant;
  color?: string;
}

export const ThemedText: React.FC<ThemedTextProps> = ({ variant = 'body', color, style, ...rest }) => {
  const theme = useTheme();
  const variantStyles = {
    h1: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold as '700' },
    h2: { fontSize: fontSize.xl, fontWeight: fontWeight.bold as '700' },
    h3: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold as '600' },
    body: { fontSize: fontSize.md, fontWeight: fontWeight.regular as '400' },
    muted: { fontSize: fontSize.sm, fontWeight: fontWeight.regular as '400' },
    caption: { fontSize: fontSize.xs, fontWeight: fontWeight.regular as '400' },
  }[variant];

  const resolvedColor = color
    ?? (variant === 'muted' || variant === 'caption' ? theme.colors.textMuted : theme.colors.text);

  return <RNText style={[variantStyles, { color: resolvedColor }, style]} {...rest} />;
};

export const Separator: React.FC<{ style?: any }> = ({ style }) => {
  const theme = useTheme();
  return <RNText style={[styles.sep, { backgroundColor: theme.colors.border }, style]} />;
};

const styles = StyleSheet.create({
  sep: { height: 1, width: '80%', marginVertical: 16 },
});
