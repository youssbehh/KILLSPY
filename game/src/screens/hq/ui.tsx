import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Keyboard, Platform, Pressable, StyleProp, StyleSheet,
  Text, TextInput, TextInputProps, View, ViewStyle,
} from 'react-native';
import { KS } from '../../theme/colors';
import { TYPO, SIZES } from '../../theme/typography';
import { GuildRole } from '../../api/guilds';
import { HqStringKey, useHqT } from './strings';

export const PAD = 16;
export const MIN_TOUCH = 44;
/** Height of the custom tab bar that overlays the bottom of the screen (see app/(tabs)/_layout). */
export const TAB_BAR_HEIGHT = 64;

export type Feedback = { text: string; ok: boolean } | null;

export const ROLE_COLOR: Record<GuildRole, string> = {
  LEADER: KS.alert,
  OFFICER: KS.primary,
  MEMBER: KS.inkMute,
};
export const ROLE_KEY: Record<GuildRole, HqStringKey> = {
  LEADER: 'roleLeader',
  OFFICER: 'roleOfficer',
  MEMBER: 'roleMember',
};

const TONE = {
  primary: KS.primary,
  live: KS.live,
  alert: KS.alert,
  danger: KS.danger,
  neutral: KS.inkMute,
} as const;
export type Tone = keyof typeof TONE;

/** Translucent tint of a hex theme colour (same convention as the rest of the app). */
export const tint = (hex: string): string => `${hex}18`;

/** True while the iOS keyboard is up (it covers the tab bar, so bottom padding can shrink). */
export const useIosKeyboardVisible = (): boolean => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (Platform.OS !== 'ios') return undefined;
    const show = Keyboard.addListener('keyboardWillShow', () => setVisible(true));
    const hide = Keyboard.addListener('keyboardWillHide', () => setVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return visible;
};

interface KsButtonProps {
  label: string;
  onPress: () => void;
  tone?: Tone;
  filled?: boolean;
  disabled?: boolean;
  busy?: boolean;
  a11yLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export const KsButton: React.FC<KsButtonProps> = ({
  label, onPress, tone = 'primary', filled = false, disabled = false, busy = false, a11yLabel, style,
}) => {
  const color = TONE[tone];
  const textColor = filled ? (tone === 'danger' || tone === 'primary' ? KS.ink : KS.bg) : color;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || busy}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel ?? label}
      accessibilityState={{ disabled: disabled || busy, busy }}
      style={[
        styles.btn,
        { borderColor: color, backgroundColor: filled ? color : tint(color) },
        disabled && styles.btnDisabled,
        style,
      ]}
    >
      {busy
        ? <ActivityIndicator size="small" color={textColor} />
        : <Text style={[styles.btnText, { color: textColor }]}>{label}</Text>}
    </Pressable>
  );
};

const DISARM_MS = 4000;

/** Two-tap button for destructive actions: the first tap arms it, the second one confirms. */
export const ConfirmButton: React.FC<Omit<KsButtonProps, 'onPress' | 'filled'> & { onConfirm: () => void }> = ({
  label, onConfirm, tone = 'danger', ...rest
}) => {
  const t = useHqT();
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return undefined;
    const timer = setTimeout(() => setArmed(false), DISARM_MS);
    return () => clearTimeout(timer);
  }, [armed]);

  const handlePress = () => {
    if (!armed) {
      setArmed(true);
      return;
    }
    setArmed(false);
    onConfirm();
  };

  return (
    <KsButton
      {...rest}
      tone={tone}
      filled={armed}
      label={armed ? t('confirm') : label}
      a11yLabel={armed ? `${label} — ${t('confirm')}` : rest.a11yLabel ?? label}
      onPress={handlePress}
    />
  );
};

export const Field: React.FC<TextInputProps & { label: string }> = ({ label, style, ...input }) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput
      placeholderTextColor={KS.inkFaint}
      accessibilityLabel={label}
      {...input}
      style={[styles.input, input.multiline && styles.inputMultiline, style]}
    />
  </View>
);

export const FeedbackLine: React.FC<{ feedback: Feedback }> = ({ feedback }) =>
  feedback ? (
    <Text
      accessibilityLiveRegion="polite"
      style={[styles.feedback, { color: feedback.ok ? KS.live : KS.danger }]}
    >
      › {feedback.text}
    </Text>
  ) : null;

export const LoadingState: React.FC = () => {
  const t = useHqT();
  return (
    <View style={styles.state} accessibilityRole="progressbar" accessibilityLabel={t('loading')}>
      <ActivityIndicator color={KS.primary} />
    </View>
  );
};

export const EmptyState: React.FC<{ text: string }> = ({ text }) => (
  <View style={styles.state}>
    <Text style={styles.stateText}>{text}</Text>
  </View>
);

export const ErrorState: React.FC<{ text: string; onRetry: () => void }> = ({ text, onRetry }) => {
  const t = useHqT();
  return (
    <View style={styles.state}>
      <Text style={[styles.stateText, { color: KS.danger }]}>{text}</Text>
      <KsButton label={t('retry')} tone="neutral" onPress={onRetry} a11yLabel={`${text} ${t('retry')}`} />
    </View>
  );
};

export const TagChip: React.FC<{ tag: string; color?: string }> = ({ tag, color = KS.primary }) => (
  <View style={[styles.tag, { borderColor: color, backgroundColor: tint(color) }]}>
    <Text style={[styles.tagText, { color }]}>[{tag}]</Text>
  </View>
);

export const styles = StyleSheet.create({
  btn: {
    minHeight: MIN_TOUCH,
    minWidth: MIN_TOUCH,
    paddingHorizontal: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.4 },
  btnText: {
    fontFamily: TYPO.monoBold,
    fontSize: SIZES.monoSm,
    letterSpacing: SIZES.monoSm * 0.18,
    textAlign: 'center',
  },
  field: { gap: 4 },
  fieldLabel: {
    color: KS.inkDim,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoXs,
    letterSpacing: SIZES.monoXs * 0.22,
  },
  input: {
    minHeight: MIN_TOUCH,
    backgroundColor: KS.surface,
    borderWidth: 1,
    borderColor: KS.hairSoft,
    color: KS.ink,
    fontFamily: TYPO.ui,
    fontSize: SIZES.bodyLg,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inputMultiline: { minHeight: 72, textAlignVertical: 'top' },
  feedback: { fontFamily: TYPO.mono, fontSize: SIZES.monoMd },
  state: { alignItems: 'center', paddingVertical: 20, gap: 10 },
  stateText: { color: KS.inkDim, fontFamily: TYPO.mono, fontSize: SIZES.monoMd, textAlign: 'center' },
  hint: { color: KS.inkDim, fontFamily: TYPO.ui, fontSize: SIZES.bodySm },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  tagText: { fontFamily: TYPO.mono, fontSize: SIZES.monoSm, letterSpacing: SIZES.monoSm * 0.18 },
  rowName: {
    color: KS.ink,
    fontFamily: TYPO.display,
    fontSize: SIZES.labelLg,
    letterSpacing: SIZES.labelLg * 0.06,
  },
  rowMeta: {
    color: KS.inkDim,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoXs,
    letterSpacing: SIZES.monoXs * 0.14,
    marginTop: 2,
  },
});
