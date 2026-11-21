/**
 * Shared accordion section component for the KS settings page.
 * Replaces the per-file `XxxParam` components that used the old light theme.
 */
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { KS } from '@/src/theme/colors';
import { TYPO, SIZES } from '@/src/theme/typography';

interface KSAccordionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export const KSAccordion: React.FC<KSAccordionProps> = ({ title, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={({ pressed }) => [styles.header, pressed && { opacity: 0.8 }]}
      >
        <Text style={styles.title}>{title.toUpperCase()}</Text>
        <Text style={[styles.chevron, open && styles.chevronOpen]}>›</Text>
      </Pressable>
      {open && <View style={styles.content}>{children}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: KS.hairSoft,
    borderRadius: 0,
    overflow: 'hidden',
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: KS.surface,
  },
  title: {
    color: KS.ink,
    fontFamily: TYPO.display,
    fontSize: SIZES.labelLg,
    letterSpacing: SIZES.labelLg * 0.1,
  },
  chevron: {
    color: KS.inkDim,
    fontFamily: TYPO.display,
    fontSize: 20,
    transform: [{ rotate: '0deg' }],
  },
  chevronOpen: {
    color: KS.primary,
    transform: [{ rotate: '90deg' }],
  },
  content: {
    backgroundColor: KS.bg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
});
