import React from 'react';
import { StyleSheet, View, ScrollView, ViewStyle, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../stores/themeStore';
import { spacing } from '../theme/tokens';

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  centered?: boolean;
  style?: ViewStyle;
}

export const Screen: React.FC<ScreenProps> = ({ children, scroll = false, padded = true, centered = false, style }) => {
  const theme = useTheme();
  const inner = (
    <View
      style={[
        styles.inner,
        padded && { padding: spacing.lg },
        centered && styles.centered,
        style,
      ]}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      <StatusBar barStyle={theme.statusBar === 'dark' ? 'dark-content' : 'light-content'} />
      {scroll ? (
        <ScrollView
          contentContainerStyle={[centered && styles.centered, { flexGrow: 1 }]}
          showsVerticalScrollIndicator={false}
        >
          {inner}
        </ScrollView>
      ) : (
        inner
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center' },
});
