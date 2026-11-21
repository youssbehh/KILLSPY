import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { KS } from '../../theme/colors';
import { TYPO, SIZES, ls } from '../../theme/typography';
import { HexAvatar } from '../../components/ks/HexAvatar';
import { RankBadge } from '../../components/ks/RankBadge';
import { rankTierIndex, rankTierName } from '../../game/rankDisplay';
import { useFriendsT } from './strings';

export const PAD = 16;
export const TOUCH = 44;
/** Height of the custom tab bar that overlays the bottom of every tab screen (see app/(tabs)/_layout). */
export const TAB_BAR_HEIGHT = 64;
/** Bottom padding of scrollable content so the last row clears the tab bar. */
export const LIST_BOTTOM_PAD = 100;
const CONFIRM_RESET_MS = 4000;

export interface PlayerRef {
  id: number;
  username: string;
}

type Tone = 'primary' | 'neutral' | 'danger' | 'live';

const TONE_COLOR: Record<Tone, string> = {
  primary: KS.primary,
  neutral: KS.inkMute,
  danger: KS.danger,
  live: KS.live,
};

interface ActionButtonProps {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
  tone?: Tone;
  busy?: boolean;
  disabled?: boolean;
  /** Stretch to the full width of the parent. */
  block?: boolean;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  label,
  onPress,
  accessibilityLabel,
  tone = 'primary',
  busy = false,
  disabled = false,
  block = false,
}) => {
  const color = TONE_COLOR[tone];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || busy}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: disabled || busy, busy }}
      style={({ pressed }) => [
        styles.action,
        { borderColor: color },
        block && styles.actionBlock,
        (disabled || busy) && styles.dimmed,
        pressed && styles.pressed,
      ]}
    >
      {busy ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <Text style={[styles.actionText, { color }]} numberOfLines={1}>
          {label}
        </Text>
      )}
    </Pressable>
  );
};

/** Two-tap destructive button: the first tap arms it, the second one confirms. */
export const ConfirmButton: React.FC<Omit<ActionButtonProps, 'onPress' | 'tone'> & { onConfirm: () => void }> = ({
  label,
  onConfirm,
  ...rest
}) => {
  const t = useFriendsT();
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(() => setArmed(false), CONFIRM_RESET_MS);
    return () => clearTimeout(timer);
  }, [armed]);

  const handlePress = () => {
    if (!armed) return setArmed(true);
    setArmed(false);
    onConfirm();
  };

  return (
    <ActionButton
      {...rest}
      label={armed ? t('confirm') : label}
      accessibilityLabel={armed ? `${rest.accessibilityLabel ?? label} — ${t('confirm')}` : rest.accessibilityLabel}
      tone={armed ? 'danger' : 'neutral'}
      onPress={handlePress}
    />
  );
};

interface StateBoxProps {
  kind: 'loading' | 'error' | 'empty';
  title?: string;
  hint?: string;
  onRetry?: () => void;
}

/** Loading / error (with retry) / empty placeholder shared by every list. */
export const StateBox: React.FC<StateBoxProps> = ({ kind, title, hint, onRetry }) => {
  const t = useFriendsT();
  if (kind === 'loading') {
    return (
      <View style={styles.state} accessibilityRole="progressbar" accessibilityLabel={t('loading')}>
        <ActivityIndicator color={KS.primary} size="large" />
      </View>
    );
  }
  return (
    <View style={styles.state}>
      {kind === 'error' || title ? (
        <Text style={[styles.stateTitle, kind === 'error' && { color: KS.danger }]}>
          {kind === 'error' ? (title ?? t('loadError')) : title}
        </Text>
      ) : null}
      {hint ? <Text style={styles.stateHint}>{hint}</Text> : null}
      {kind === 'error' && onRetry ? <ActionButton label={t('retry')} onPress={onRetry} /> : null}
    </View>
  );
};

export const Feedback: React.FC<{ text: string | null; ok?: boolean }> = ({ text, ok = false }) =>
  text ? (
    <Text style={[styles.feedback, { color: ok ? KS.live : KS.danger }]} accessibilityLiveRegion="polite">
      › {text}
    </Text>
  ) : null;

interface PlayerRowProps {
  username: string;
  mmr?: number;
  online?: boolean;
  /** Extra line under the rank (e.g. last message preview). */
  subtitle?: string;
  meta?: string;
  onPress?: () => void;
  pressLabel?: string;
  children?: React.ReactNode;
}

/** Avatar + name + rank on the left (optionally pressable), actions on the right. */
export const PlayerRow: React.FC<PlayerRowProps> = ({
  username,
  mmr,
  online,
  subtitle,
  meta,
  onPress,
  pressLabel,
  children,
}) => {
  const t = useFriendsT();
  const body = (
    <>
      <HexAvatar size={TOUCH} tier={rankTierName(mmr ?? 0)} initials={username} live={online === true} />
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text style={styles.rowName} numberOfLines={1}>
            {username}
          </Text>
          {meta ? <Text style={styles.rowMeta}>{meta}</Text> : null}
        </View>
        {mmr !== undefined ? (
          <View style={styles.rowRank}>
            <RankBadge tier={rankTierIndex(mmr)} size={18} />
            <Text style={styles.rowMmr}>{t('mmr', { mmr })}</Text>
            {online !== undefined ? (
              <Text style={[styles.rowMmr, { color: online ? KS.live : KS.inkDim }]}>
                · {online ? t('online') : t('offline')}
              </Text>
            ) : null}
          </View>
        ) : null}
        {subtitle !== undefined ? (
          <Text style={styles.rowSub} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </>
  );

  return (
    <View style={styles.row}>
      {onPress ? (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={pressLabel ?? username}
          style={({ pressed }) => [styles.rowMain, pressed && styles.pressed]}
        >
          {body}
        </Pressable>
      ) : (
        <View style={styles.rowMain}>{body}</View>
      )}
      {children ? <View style={styles.rowActions}>{children}</View> : null}
    </View>
  );
};

export const CountBadge: React.FC<{ count: number; max?: number }> = ({ count, max = 9 }) =>
  count > 0 ? (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > max ? `${max}+` : count}</Text>
    </View>
  ) : null;

const styles = StyleSheet.create({
  action: {
    minHeight: TOUCH,
    minWidth: TOUCH,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: KS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBlock: { alignSelf: 'stretch' },
  actionText: { fontFamily: TYPO.display, fontSize: SIZES.bodySm, letterSpacing: ls(SIZES.bodySm, 0.08) },
  dimmed: { opacity: 0.45 },
  pressed: { opacity: 0.7 },

  state: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 24, gap: 10 },
  stateTitle: {
    fontFamily: TYPO.display,
    fontSize: SIZES.titleSm,
    color: KS.inkDim,
    letterSpacing: ls(SIZES.titleSm, 0.12),
    textAlign: 'center',
  },
  stateHint: { fontFamily: TYPO.mono, fontSize: SIZES.monoMd, color: KS.inkDim, textAlign: 'center' },
  feedback: { fontFamily: TYPO.mono, fontSize: SIZES.monoMd, paddingHorizontal: PAD, paddingVertical: 8 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: PAD,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: KS.divider,
  },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, minHeight: TOUCH + 20 },
  rowBody: { flex: 1, gap: 3 },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  rowName: { flexShrink: 1, fontFamily: TYPO.uiBold, fontSize: SIZES.body, color: KS.ink, letterSpacing: 0.4 },
  rowMeta: { fontFamily: TYPO.mono, fontSize: SIZES.monoMd, color: KS.inkDim },
  rowSub: { fontFamily: TYPO.ui, fontSize: SIZES.bodySm, color: KS.inkDim },
  rowRank: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowMmr: { fontFamily: TYPO.mono, fontSize: SIZES.monoSm, color: KS.inkMute },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  badge: {
    backgroundColor: KS.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: { fontFamily: TYPO.monoBold, fontSize: SIZES.monoSm, color: KS.ink },
});
