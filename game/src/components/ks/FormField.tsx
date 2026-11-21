import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { KS } from '../../theme/colors';
import { TYPO, SIZES } from '../../theme/typography';

/** Inline feedback under a form: green when `ok`, red otherwise. */
export type Notice = { text: string; ok: boolean } | null;

type FieldProps = TextInputProps & {
  label: string;
  /** Helper text shown under the input (password rules, code validity…). */
  hint?: string;
  /** Monospace, widely spaced input for one-time codes. */
  code?: boolean;
};

export const Field: React.FC<FieldProps> = ({ label, hint, code, ...input }) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label.toUpperCase()}</Text>
    <TextInput
      {...input}
      accessibilityLabel={label}
      accessibilityHint={hint}
      placeholderTextColor={KS.inkFaint}
      selectionColor={KS.primary}
      style={[styles.input, code && styles.inputCode, input.editable === false && styles.inputDisabled]}
    />
    {hint ? <Text style={styles.hint}>{hint}</Text> : null}
  </View>
);

export const Check: React.FC<{ label: string; checked: boolean; onToggle: () => void }> = ({
  label,
  checked,
  onToggle,
}) => (
  <Pressable
    onPress={onToggle}
    accessibilityRole="checkbox"
    accessibilityLabel={label}
    accessibilityState={{ checked }}
    hitSlop={8}
    style={styles.check}
  >
    <View style={[styles.checkBox, checked && styles.checkBoxOn]}>
      {checked && <Text style={styles.checkMark}>✓</Text>}
    </View>
    <Text style={styles.checkLabel}>{label}</Text>
  </Pressable>
);

export const FormNotice: React.FC<{ notice: Notice }> = ({ notice }) =>
  notice ? (
    <Text
      style={[styles.notice, { color: notice.ok ? KS.live : KS.danger }]}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
    >
      › {notice.text}
    </Text>
  ) : null;

/** Text-only action (secondary navigation, "send a new code"…). */
export const LinkButton: React.FC<{
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}> = ({ label, onPress, disabled = false, style }) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    accessibilityRole="button"
    accessibilityLabel={label}
    accessibilityState={{ disabled }}
    hitSlop={8}
    style={({ pressed }) => [styles.link, (disabled || pressed) && styles.linkDim, style]}
  >
    <Text style={styles.linkText}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  field: { marginBottom: 14, gap: 6 },
  fieldLabel: {
    color: KS.inkDim,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoSm,
    letterSpacing: SIZES.monoSm * 0.18,
  },
  input: {
    height: 48,
    paddingHorizontal: 14,
    backgroundColor: KS.surface,
    borderWidth: 1,
    borderColor: KS.hairSoft,
    borderRadius: 4,
    color: KS.ink,
    fontFamily: TYPO.ui,
    fontSize: SIZES.bodyLg,
  },
  inputCode: {
    fontFamily: TYPO.monoBold,
    letterSpacing: SIZES.bodyLg * 0.32,
  },
  inputDisabled: { color: KS.inkDim },
  hint: {
    color: KS.inkDim,
    fontFamily: TYPO.ui,
    fontSize: SIZES.bodySm,
  },
  check: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48 },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: KS.hair,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxOn: { backgroundColor: KS.primary, borderColor: KS.primary },
  checkMark: { color: KS.ink, fontFamily: TYPO.uiBold, fontSize: SIZES.body },
  checkLabel: { color: KS.inkMute, fontFamily: TYPO.ui, fontSize: SIZES.body, flexShrink: 1 },
  notice: { fontFamily: TYPO.mono, fontSize: SIZES.monoMd, marginTop: 4, marginBottom: 4 },
  link: { alignSelf: 'center', minHeight: 48, paddingHorizontal: 8, justifyContent: 'center' },
  linkDim: { opacity: 0.5 },
  linkText: { color: KS.primary, fontFamily: TYPO.uiBold, fontSize: SIZES.body, textAlign: 'center' },
});
