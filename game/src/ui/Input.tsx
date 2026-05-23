import React, { forwardRef } from 'react';
import { TextInput, StyleSheet, TextInputProps, View, Text } from 'react-native';
import { useTheme } from '../stores/themeStore';
import { radius, spacing, fontSize } from '../theme/tokens';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const Input = forwardRef<TextInput, InputProps>(({ label, error, style, ...rest }, ref) => {
  const theme = useTheme();
  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text style={[styles.label, { color: theme.colors.textMuted }]}>{label}</Text>
      ) : null}
      <TextInput
        ref={ref}
        placeholderTextColor={theme.colors.textMuted}
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.surface,
            borderColor: error ? theme.colors.danger : theme.colors.border,
            color: theme.colors.text,
          },
          style,
        ]}
        {...rest}
      />
      {error ? <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text> : null}
    </View>
  );
});

Input.displayName = 'Input';

const styles = StyleSheet.create({
  wrapper: { width: '100%', marginBottom: spacing.md },
  label: { fontSize: fontSize.sm, marginBottom: spacing.xs },
  input: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.md,
  },
  error: { fontSize: fontSize.xs, marginTop: spacing.xs },
});
