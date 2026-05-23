import React from 'react';
import { Pressable, StyleSheet, Text, ActivityIndicator, View, PressableProps } from 'react-native';
import { useTheme } from '../stores/themeStore';
import { radius, spacing, fontSize, fontWeight } from '../theme/tokens';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = true,
  disabled,
  ...rest
}) => {
  const theme = useTheme();
  const palette = {
    primary: { bg: theme.colors.primary, fg: theme.colors.primaryText, border: theme.colors.primary },
    secondary: { bg: theme.colors.secondary, fg: theme.colors.primaryText, border: theme.colors.secondary },
    ghost: { bg: 'transparent', fg: theme.colors.primary, border: theme.colors.primary },
    danger: { bg: theme.colors.danger, fg: '#ffffff', border: theme.colors.danger },
  }[variant];

  const heights: Record<Size, number> = { sm: 36, md: 48, lg: 56 };
  const paddings: Record<Size, number> = { sm: spacing.md, md: spacing.lg, lg: spacing.lg };

  const isDisabled = disabled || loading;

  return (
    <Pressable
      disabled={isDisabled}
      {...rest}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          height: heights[size],
          paddingHorizontal: paddings[size],
          opacity: isDisabled ? 0.55 : pressed ? 0.85 : 1,
          width: fullWidth ? '100%' : undefined,
        },
      ]}
    >
      <View style={styles.row}>
        {loading ? <ActivityIndicator color={palette.fg} /> : null}
        <Text
          style={[
            styles.label,
            {
              color: palette.fg,
              fontSize: size === 'sm' ? fontSize.sm : fontSize.md,
              marginLeft: loading ? spacing.sm : 0,
            },
          ]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  label: { fontWeight: fontWeight.bold as '700' },
});
