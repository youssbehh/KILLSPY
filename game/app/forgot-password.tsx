import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRequestPasswordReset, useResetPassword } from '@/src/hooks/useAccount';
import { extractApiError } from '@/src/api/client';
import { useLocalT } from '@/src/i18n/local';
import { KS } from '@/src/theme/colors';
import { TYPO, SIZES } from '@/src/theme/typography';
import { TopoBg } from '@/src/components/ks/TopoBg';
import { Logo } from '@/src/components/ks/Logo';
import { PrimaryButton } from '@/src/components/ks/PrimaryButton';
import { Field, FormNotice, LinkButton, Notice } from '@/src/components/ks/FormField';
import { ACCOUNT_STRINGS } from '@/src/screens/account/strings';
import {
  CODE_LENGTH,
  checkCode,
  checkEmail,
  checkNewPassword,
  normalizeCode,
  normalizeEmail,
  useCooldown,
} from '@/src/screens/account/rules';

type Step = 'email' | 'code' | 'done';

export default function ForgotPasswordScreen() {
  const t = useLocalT(ACCOUNT_STRINGS);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const requestMutation = useRequestPasswordReset();
  const resetMutation = useResetPassword();
  const cooldown = useCooldown();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [notice, setNotice] = useState<Notice>(null);

  const isLoading = requestMutation.isPending || resetMutation.isPending;
  const fail = (text: string) => setNotice({ text, ok: false });

  /** Used by the first step and by "send a new code". */
  const requestCode = async () => {
    if (isLoading) return;
    const emailError = checkEmail(email);
    if (emailError) return fail(t(emailError));

    const address = normalizeEmail(email);
    try {
      await requestMutation.mutateAsync(address);
      setEmail(address);
      setCode('');
      setStep('code');
      cooldown.start();
      // Same wording whether or not the address is known: the server never tells.
      setNotice({ text: t('forgotSent', { email: address }), ok: true });
    } catch (e) {
      fail(extractApiError(e).message);
    }
  };

  const submitReset = async () => {
    if (isLoading) return;
    const error = checkCode(code) ?? checkNewPassword(password, confirmation);
    if (error) return fail(t(error));

    try {
      await resetMutation.mutateAsync({ email: normalizeEmail(email), code: normalizeCode(code), password });
      setCode('');
      setPassword('');
      setConfirmation('');
      setStep('done');
      setNotice({ text: t('forgotDone'), ok: true });
    } catch (e) {
      fail(extractApiError(e).message);
    }
  };

  const backToEmail = () => {
    setNotice(null);
    setCode('');
    setPassword('');
    setConfirmation('');
    setStep('email');
  };

  const backToLogin = () => router.replace('/');

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <TopoBg />
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={[
              styles.scroll,
              { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.logo}>
              <Logo size={56} />
              <Text style={styles.eyebrow} accessibilityRole="header">
                // {t('forgotTitle')}
              </Text>
            </View>

            {step === 'email' && (
              <>
                <Text style={styles.intro}>{t('forgotIntro')}</Text>
                <Field
                  label={t('email')}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="send"
                  onSubmitEditing={requestCode}
                />
                <FormNotice notice={notice} />
                <PrimaryButton
                  label={requestMutation.isPending ? t('pending') : t('forgotSend')}
                  onPress={requestCode}
                  disabled={isLoading}
                  size="large"
                  style={styles.cta}
                />
                <LinkButton label={t('backToLogin')} onPress={backToLogin} disabled={isLoading} />
              </>
            )}

            {step === 'code' && (
              <>
                <Field
                  label={t('code')}
                  value={code}
                  onChangeText={(value) => setCode(normalizeCode(value))}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  autoComplete="one-time-code"
                  textContentType="oneTimeCode"
                  maxLength={CODE_LENGTH}
                  hint={t('forgotCodeHint')}
                  code
                />
                <Field
                  label={t('newPassword')}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="new-password"
                  textContentType="newPassword"
                  maxLength={72}
                  hint={t('passwordRules')}
                />
                <Field
                  label={t('confirmPassword')}
                  value={confirmation}
                  onChangeText={setConfirmation}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="new-password"
                  textContentType="newPassword"
                  maxLength={72}
                  returnKeyType="send"
                  onSubmitEditing={submitReset}
                />
                <FormNotice notice={notice} />
                <PrimaryButton
                  label={resetMutation.isPending ? t('pending') : t('forgotSubmit')}
                  onPress={submitReset}
                  disabled={isLoading}
                  size="large"
                  style={styles.cta}
                />
                <LinkButton
                  label={cooldown.left > 0 ? t('resendIn', { seconds: cooldown.left }) : t('resend')}
                  onPress={requestCode}
                  disabled={isLoading || cooldown.left > 0}
                />
                <LinkButton label={t('changeEmail')} onPress={backToEmail} disabled={isLoading} />
                <LinkButton label={t('backToLogin')} onPress={backToLogin} disabled={isLoading} />
              </>
            )}

            {step === 'done' && (
              <>
                <FormNotice notice={notice} />
                <PrimaryButton label={t('backToLogin')} onPress={backToLogin} size="large" style={styles.cta} />
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: KS.bg },
  scroll: { flexGrow: 1, paddingHorizontal: 24, maxWidth: 480, width: '100%', alignSelf: 'center' },
  logo: { alignItems: 'center', marginBottom: 32, gap: 10 },
  eyebrow: {
    color: KS.primary,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoMd,
    letterSpacing: SIZES.monoMd * 0.18,
    textTransform: 'uppercase',
  },
  intro: {
    color: KS.inkMute,
    fontFamily: TYPO.ui,
    fontSize: SIZES.body,
    lineHeight: SIZES.body * 1.5,
    marginBottom: 18,
  },
  cta: { marginTop: 12, marginBottom: 6, alignSelf: 'stretch' },
});
