import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AlertModal from '@/components/AlertModal';
import LoadingOverlay from '@/components/LoadingOverlay';
import { appVersion } from '../config';
import { useLoginMutation, useGuestMutation, useSignupMutation } from '@/src/hooks/useAuthFlow';
import { ping } from '@/src/api/auth';
import { extractApiError } from '@/src/api/client';
import { useT } from '@/src/i18n';
import { KS } from '@/src/theme/colors';
import { TYPO, SIZES } from '@/src/theme/typography';
import { TopoBg } from '@/src/components/ks/TopoBg';
import { Logo } from '@/src/components/ks/Logo';
import { PrimaryButton } from '@/src/components/ks/PrimaryButton';
import { SecondaryButton } from '@/src/components/ks/SecondaryButton';

const REMEMBERED_KEY = 'rememberedIdentifier';
const RGPD_DELAY_SECS = 5;

type Notice = { text: string; ok: boolean } | null;

// Navigation after a successful login is handled by the auth guard in app/_layout.tsx.
export default function LoginFormScreen() {
  const t = useT();
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
    if (passwordCrea !== confirmPassword) return fail(t('errPasswordMismatch'));
    if (!acceptTerms) return fail(t('errAcceptTerms'));

    try {
      await signupMutation.mutateAsync({ username, email, passwordCrea });
      setIdentifier(username);
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
              />
              <Text style={styles.hint}>{t('passwordRules')}</Text>
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

          {notice && (
            <Text
              style={[styles.notice, { color: notice.ok ? KS.live : KS.danger }]}
              accessibilityLiveRegion="polite"
            >
              › {notice.text}
            </Text>
          )}

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

          <Pressable onPress={switchForm} accessibilityRole="button" hitSlop={12} style={styles.switch}>
            <Text style={styles.switchText}>
              {isLoginForm ? t('createAccount') : t('alreadyHaveAccount')}
            </Text>
          </Pressable>

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

// ── Sub-components ──────────────────────────────────────────────────────────

const Field: React.FC<TextInputProps & { label: string }> = ({ label, ...input }) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label.toUpperCase()}</Text>
    <TextInput
      {...input}
      accessibilityLabel={label}
      placeholderTextColor={KS.inkFaint}
      selectionColor={KS.primary}
      style={styles.input}
    />
  </View>
);

const Check: React.FC<{ label: string; checked: boolean; onToggle: () => void }> = ({
  label,
  checked,
  onToggle,
}) => (
  <Pressable
    onPress={onToggle}
    accessibilityRole="checkbox"
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
  hint: {
    color: KS.inkDim,
    fontFamily: TYPO.ui,
    fontSize: SIZES.bodySm,
    marginTop: -6,
    marginBottom: 14,
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
  cta: { marginTop: 12, marginBottom: 10, alignSelf: 'stretch' },
  switch: { alignSelf: 'center', paddingVertical: 16, minHeight: 48, justifyContent: 'center' },
  switchText: { color: KS.primary, fontFamily: TYPO.uiBold, fontSize: SIZES.body },
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
