import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { KS } from '../../theme/colors';
import { TYPO, SIZES, ls } from '../../theme/typography';
import { useChallengeStore } from '../../stores/challengeStore';
import { useFriendsT } from './strings';
import { ActionButton, PAD } from './ui';

const useSecondsLeft = (expiresAt: number | null): number => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (expiresAt === null) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);
  return expiresAt === null ? 0 : Math.max(0, Math.ceil((expiresAt - now) / 1000));
};

/**
 * State of the duel I asked for: waiting (with cancel), then why it ended.
 * The incoming challenge popup and the navigation to the match live elsewhere.
 */
export const ChallengeBanner: React.FC<{ sendFailed: boolean; onDismissError: () => void }> = ({
  sendFailed,
  onDismissError,
}) => {
  const t = useFriendsT();
  const outgoing = useChallengeStore((s) => s.outgoing);
  const lastClosed = useChallengeStore((s) => s.lastClosed);
  const seconds = useSecondsLeft(outgoing?.expiresAt ?? null);

  if (outgoing) {
    return (
      <View style={[styles.banner, { borderColor: KS.alert }]} accessibilityLiveRegion="polite">
        <View style={styles.texts}>
          <Text style={[styles.title, { color: KS.alert }]} numberOfLines={1}>
            {t('challengeWaiting', { name: outgoing.to.username })}
          </Text>
          <Text style={styles.hint}>{t('challengeWaitingHint', { seconds })}</Text>
        </View>
        <ActionButton
          label={t('cancel')}
          accessibilityLabel={t('challengeCancel')}
          tone="neutral"
          onPress={() => useChallengeStore.getState().cancelChallenge()}
        />
      </View>
    );
  }

  if (sendFailed) {
    return (
      <View style={[styles.banner, { borderColor: KS.danger }]} accessibilityLiveRegion="polite">
        <Text style={[styles.hint, styles.texts, { color: KS.danger }]}>{t('challengeSendError')}</Text>
        <ActionButton label="✕" accessibilityLabel={t('dismiss')} tone="neutral" onPress={onDismissError} />
      </View>
    );
  }

  if (lastClosed) {
    return (
      <View style={[styles.banner, { borderColor: KS.hairSoft }]} accessibilityLiveRegion="polite">
        <Text style={[styles.hint, styles.texts, { color: KS.inkMute }]}>
          {t(`closed_${lastClosed.reason}`, { name: lastClosed.username ?? t('somebody') })}
        </Text>
        <ActionButton
          label="✕"
          accessibilityLabel={t('dismiss')}
          tone="neutral"
          onPress={() => useChallengeStore.getState().clearClosed()}
        />
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: PAD,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: KS.surface,
  },
  texts: { flex: 1 },
  title: { fontFamily: TYPO.display, fontSize: SIZES.body, letterSpacing: ls(SIZES.body, 0.08) },
  hint: { fontFamily: TYPO.mono, fontSize: SIZES.monoMd, color: KS.inkDim },
});
