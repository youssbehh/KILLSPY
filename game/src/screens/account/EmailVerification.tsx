import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuthStore } from '@/src/stores/authStore';
import { useSendVerificationEmail, useVerifyEmail } from '@/src/hooks/useAccount';
import { extractApiError } from '@/src/api/client';
import { useLocalT } from '@/src/i18n/local';
import { Field, FormNotice, LinkButton, Notice } from '@/src/components/ks/FormField';
import { PrimaryButton } from '@/src/components/ks/PrimaryButton';
import { KS } from '@/src/theme/colors';
import { TYPO, SIZES } from '@/src/theme/typography';
import { ACCOUNT_STRINGS } from './strings';
import { CODE_LENGTH, checkCode, normalizeCode, useCooldown } from './rules';

/** E-mail status of a registered account: verified badge, or the "send a code → type it" flow. */
export const EmailVerification = () => {
  const t = useLocalT(ACCOUNT_STRINGS);
  const email = useAuthStore((s) => s.user?.email ?? '');
  const verified = useAuthStore((s) => s.user?.emailVerified ?? false);
  const sendMutation = useSendVerificationEmail();
  const verifyMutation = useVerifyEmail();
  const cooldown = useCooldown();

  const [codeVisible, setCodeVisible] = useState(false);
  const [code, setCode] = useState('');
  const [notice, setNotice] = useState<Notice>(null);

  const isLoading = sendMutation.isPending || verifyMutation.isPending;
  const fail = (text: string) => setNotice({ text, ok: false });

  const sendCode = async () => {
    if (isLoading) return;
    try {
      await sendMutation.mutateAsync();
      setCode('');
      setCodeVisible(true);
      cooldown.start();
      setNotice({ text: t('verifySent', { email }), ok: true });
    } catch (e) {
      fail(extractApiError(e).message);
    }
  };

  const submitCode = async () => {
    if (isLoading) return;
    const error = checkCode(code);
    if (error) return fail(t(error));
    try {
      // The hook flips `emailVerified` in the store: the badge below takes over.
      await verifyMutation.mutateAsync(normalizeCode(code));
      setCode('');
      setCodeVisible(false);
      setNotice({ text: t('verifyDone'), ok: true });
    } catch (e) {
      fail(extractApiError(e).message);
    }
  };

  const statusColor = verified ? KS.live : KS.alert;
  const status = verified ? t('verified') : t('notVerified');

  return (
    <View style={styles.section}>
      <Text style={styles.label}>{t('verifyTitle').toUpperCase()}</Text>
      <View style={styles.statusRow} accessible accessibilityLabel={`${email} — ${status}`}>
        <Text style={styles.email} numberOfLines={1}>
          {email}
        </Text>
        <View style={[styles.badge, { borderColor: statusColor }]}>
          <Text style={[styles.badgeText, { color: statusColor }]}>
            {verified ? '✓ ' : '! '}
            {status.toUpperCase()}
          </Text>
        </View>
      </View>

      {verified ? (
        <FormNotice notice={notice} />
      ) : (
        <>
          <Text style={styles.body}>{t('verifyIntro')}</Text>

          {codeVisible && (
            <Field
              label={t('code')}
              value={code}
              onChangeText={(value) => setCode(normalizeCode(value))}
              autoCapitalize="characters"
              autoCorrect={false}
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              maxLength={CODE_LENGTH}
              hint={t('verifyCodeHint')}
              returnKeyType="send"
              onSubmitEditing={submitCode}
              code
            />
          )}

          <FormNotice notice={notice} />

          {codeVisible ? (
            <>
              <PrimaryButton
                label={verifyMutation.isPending ? t('pending') : t('verifySubmit')}
                onPress={submitCode}
                disabled={isLoading}
                size="medium"
              />
              <LinkButton
                label={cooldown.left > 0 ? t('resendIn', { seconds: cooldown.left }) : t('resend')}
                onPress={sendCode}
                disabled={isLoading || cooldown.left > 0}
              />
            </>
          ) : (
            <>
              <PrimaryButton
                label={sendMutation.isPending ? t('pending') : t('verifySend')}
                onPress={sendCode}
                disabled={isLoading}
                size="medium"
              />
              <LinkButton
                label={t('verifyHaveCode')}
                onPress={() => {
                  setNotice(null);
                  setCodeVisible(true);
                }}
                disabled={isLoading}
              />
            </>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: { gap: 8 },
  label: {
    color: KS.inkDim,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoSm,
    letterSpacing: SIZES.monoSm * 0.18,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  email: { color: KS.ink, fontFamily: TYPO.ui, fontSize: SIZES.bodyLg, flexShrink: 1 },
  badge: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: {
    fontFamily: TYPO.monoBold,
    fontSize: SIZES.monoSm,
    letterSpacing: SIZES.monoSm * 0.18,
  },
  body: {
    color: KS.inkDim,
    fontFamily: TYPO.ui,
    fontSize: SIZES.body,
    lineHeight: SIZES.body * 1.5,
  },
});
