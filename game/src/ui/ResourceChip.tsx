import React from 'react';
import { View, StyleSheet, Pressable, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../stores/themeStore';
import { radius, spacing, fontSize, fontWeight, stickerRelief } from '../theme/tokens';
import { ThemedText } from './ThemedText';

interface ResourceChipProps {
  icon: React.ReactNode;
  value: string | number;
  color?: string;
  edgeColor?: string;
  onPressPlus?: () => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Pill-shaped chip used in the HUD: [icon] [value] [+]
 * The optional + button is shown when onPressPlus is provided.
 */
export const ResourceChip: React.FC<ResourceChipProps> = ({
  icon,
  value,
  color,
  edgeColor,
  onPressPlus,
  style,
}) => {
  const theme = useTheme();
  const bg = color ?? theme.colors.surfaceAlt;
  const edge = edgeColor ?? theme.colors.border;

  return (
    <View style={[styles.wrapper, style]}>
      <View
        style={{
          position: 'absolute',
          left: 0, right: 0, top: stickerRelief.sm, bottom: -stickerRelief.sm,
          backgroundColor: edge,
          borderRadius: radius.pill,
        }}
      />
      <View style={[styles.chip, { backgroundColor: bg, borderColor: edge }]}>
        <View style={styles.icon}>{icon}</View>
        <ThemedText style={styles.value}>{String(value)}</ThemedText>
        {onPressPlus && (
          <Pressable
            onPress={onPressPlus}
            style={[styles.plus, { backgroundColor: theme.colors.primary, borderColor: theme.colors.primaryDark }]}
          >
            <ThemedText color={theme.colors.primaryText} style={styles.plusText}>+</ThemedText>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { position: 'relative' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    minWidth: 80,
    height: 32,
  },
  icon: { width: 20, height: 20, marginRight: spacing.xs, alignItems: 'center', justifyContent: 'center' },
  value: { fontSize: fontSize.sm, fontWeight: fontWeight.bold as '700' },
  plus: {
    width: 22, height: 22,
    borderRadius: 11,
    marginLeft: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderBottomWidth: 2,
  },
  plusText: { fontSize: 14, fontWeight: fontWeight.bold as '700', lineHeight: 16 },
});
