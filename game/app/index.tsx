import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AlertModal from '@/components/AlertModal';
import LoadingOverlay from '@/components/LoadingOverlay';
import { appVersion } from '../config';
import { useLoginMutation, useGuestMutation, useSignupMutation } from '@/src/hooks/useAuthFlow';
import { ping } from '@/src/api/auth';
import { extractApiError } from '@/src/api/client';
import { useT } from '@/src/i18n';
import { useLocalT } from '@/src/i18n/local';
import { KS } from '@/src/theme/colors';
import { TYPO, SIZES } from '@/src/theme/typography';
import { TopoBg } from '@/src/components/ks/TopoBg';
import { Logo } from '@/src/components/ks/Logo';
import { PrimaryButton } from '@/src/components/ks/PrimaryButton';
import { SecondaryButton } from '@/src/components/ks/SecondaryButton';
import { Check, Field, FormNotice, LinkButton, Notice } from '@/src/components/ks/FormField';
import { ACCOUNT_STRINGS } from '@/src/screens/account/strings';
import { checkEmail, checkPassword, checkUsername, normalizeEmail } from '@/src/screens/account/rules';

const REMEMBERED_KEY = 'rememberedIdentifier';
const RGPD_DELAY_SECS = 5;

// Navigation after a successful login is handled by the auth guard in app/_layout.tsx.
export default function LoginFormScreen() {
  const t = useT();
  const tAccount = useLocalT(ACCOUNT_STRINGS);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const loginMutation = useLoginMutation();
  const guestMutation = useGuestMutation();
  const signupMutation = useSignupMutation();

  const [isLoginForm, setIsLoginForm] = useState(true);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [passwordCrea, setPasswordCrea] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [rgpdVisible, setRgpdVisible] = useState(false);
  const [rgpdCountdown, setRgpdCountdown] = useState(RGPD_DELAY_SECS);
  const [notice, setNotice] = useState<Notice>(null);
  const [serverUp, setServerUp] = useState<boolean | null>(null);

  const isLoading = loginMutation.isPending || guestMutation.isPending || signupMutation.isPending;

  useEffect(() => {
    let alive = true;
    ping().then((up) => alive && setServerUp(up));
    AsyncStorage.getItem(REMEMBERED_KEY).then((saved) => {
      if (alive && saved) {
        setIdentifier(saved);
        setRememberMe(true);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  // The consent button unlocks after a short reading delay.
  useEffect(() => {
    if (!rgpdVisible || rgpdCountdown <= 0) return;
    const timer = setTimeout(() => setRgpdCountdown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [rgpdVisible, rgpdCountdown]);

  const fail = (text: string) => setNotice({ text, ok: false });

  const switchForm = () => {
    setNotice(null);
    setIsLoginForm((prev) => !prev);
  };

  const openRgpd = () => {
    setRgpdCountdown(RGPD_DELAY_SECS);
    setRgpdVisible(true);
  };

  const handleSignup = async () => {
    if (!username || !email) return fail(t('errFieldsEmpty'));
    // Same rules as the server, which only answers "invalid data" when one is broken.
    const ruleError = checkUsername(username) ?? checkEmail(email) ?? checkPassword(passwordCrea);
    if (ruleError) return fail(tAccount(ruleError));
    if (passwordCrea !== confirmPassword) return fail(t('errPasswordMismatch'));
    if (!acceptTerms) return fail(t('errAcceptTerms'));

    try {
      await signupMutation.mutateAsync({ username: username.trim(), email: normalizeEmail(email), passwordCrea });
      setIdentifier(username.trim());
      setUsername('');
      setEmail('');
      setPasswordCrea('');
      setConfirmPassword('');
      setAcceptTerms(false);
      setIsLoginForm(true);
      setNotice({ text: t('signupSuccess'), ok: true });
    } catch (e) {
      fail(extractApiError(e).message);
    }
  };

  const handleLogin = async () => {
    if (!identifier || !password) return fail(t('errFieldsEmpty'));
    try {
      await loginMutation.mutateAsync({ identifier: identifier.trim(), password });
      if (rememberMe) await AsyncStorage.setItem(REMEMBERED_KEY, identifier.trim());
      else await AsyncStorage.removeItem(REMEMBERED_KEY);
    } catch (e) {
      fail(extractApiError(e).message);
    }
  };

  const handleGuest = async () => {
    try {
      await guestMutation.mutateAsync();
    } catch (e) {
      fail(extractApiError(e).message);
    }
  };

  return (
    <View style={styles.container}>
      <TopoBg />
      <LoadingOverlay isLoading={isLoading} />

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
            <Logo size={56} animated />
            <Text style={styles.eyebrow}>// {isLoginForm ? t('loginButton') : t('createAccount')}</Text>
          </View>

          {isLoginForm ? (
            <>
              <Field
                label={t('emailOrUsername')}
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
                autoComplete="username"
              />
              <Field
                label={t('password')}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="current-password"
                onSubmitEditing={handleLogin}
              />
              <Check label={t('rememberMe')} checked={rememberMe} onToggle={() => setRememberMe((v) => !v)} />
              <LinkButton
                label={tAccount('forgotLink')}
                onPress={() => router.push('/forgot-password')}
                disabled={isLoading}
                style={styles.forgot}
              />
            </>
          ) : (
            <>
              <Field
                label={t('username')}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoComplete="username-new"
              />
              <Field
                label={t('email')}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
              <Field
                label={t('password')}
                value={passwordCrea}
                onChangeText={setPasswordCrea}
                secureTextEntry
                autoComplete="new-password"
                hint={t('passwordRules')}
              />
              <Field
                label={t('passwordConfirm')}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoComplete="new-password"
              />
              <Check
                label={t('acceptTerms')}
                checked={acceptTerms}
                onToggle={() => (acceptTerms ? setAcceptTerms(false) : openRgpd())}
              />
            </>
          )}

          <FormNotice notice={notice} />

          <PrimaryButton
            label={(isLoginForm ? t('loginButton') : t('signup')).toUpperCase()}
            onPress={isLoginForm ? handleLogin : handleSignup}
            disabled={isLoading}
            size="large"
            style={styles.cta}
          />
          <SecondaryButton
            label={t('playAsGuest').toUpperCase()}
            onPress={handleGuest}
            disabled={isLoading}
          />

          <LinkButton
            label={isLoginForm ? t('createAccount') : t('alreadyHaveAccount')}
            onPress={switchForm}
            disabled={isLoading}
            style={styles.switch}
          />

          <View style={styles.footer}>
            {serverUp !== null && (
              <View style={styles.serverRow}>
                <View style={[styles.serverDot, { backgroundColor: serverUp ? KS.live : KS.danger }]} />
                <Text style={styles.footerText}>{serverUp ? t('serverOnline') : t('serverOffline')}</Text>
              </View>
            )}
            <Text style={styles.footerText}>MIMIR STUDIO · V{appVersion}</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <AlertModal
        visible={rgpdVisible}
        text1={t('rgpdIntro')}
        text2={t('rgpdData')}
        text3={t('rgpdUsage')}
        error1Button={rgpdCountdown > 0 ? `${rgpdCountdown}…` : t('iAccept')}
        onPressError1={() => {
          if (rgpdCountdown > 0) return;
          setRgpdVisible(false);
          setAcceptTerms(true);
        }}
        disabledError1={rgpdCountdown > 0}
        button1={t('iRefuse')}
        onPress1={() => {
          setRgpdVisible(false);
          setAcceptTerms(false);
        }}
      />
    </View>
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
  cta: { marginTop: 12, marginBottom: 10, alignSelf: 'stretch' },
  switch: { marginTop: 4 },
  forgot: { alignSelf: 'flex-end' },
  footer: { marginTop: 'auto', paddingTop: 16, alignItems: 'center', gap: 6 },
  serverRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  serverDot: { width: 7, height: 7, borderRadius: 4 },
  footerText: {
    color: KS.inkDim,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoSm,
    letterSpacing: SIZES.monoSm * 0.18,
  },
});
