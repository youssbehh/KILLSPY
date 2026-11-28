import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useUpgradeGuest } from '@/src/hooks/useAccount';
import { extractApiError } from '@/src/api/client';
import { useLocalT } from '@/src/i18n/local';
import { Check, Field, FormNotice, Notice } from '@/src/components/ks/FormField';
import { ConsentModal } from '@/src/components/ks/ConsentModal';
import { useT } from '@/src/i18n';
import { PrimaryButton } from '@/src/components/ks/PrimaryButton';
import { KS } from '@/src/theme/colors';
import { TYPO, SIZES } from '@/src/theme/typography';
import { ACCOUNT_STRINGS } from './strings';
import { checkEmail, checkNewPassword, checkUsername, normalizeEmail } from './rules';

/**
 * Guest → account. On success the hook replaces the session, the user stops being a
 * guest and the parent unmounts this form: the confirmation is the parent's job (`onDone`).
 */
export const GuestUpgradeForm: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const t = useLocalT(ACCOUNT_STRINGS);
  const tCommon = useT();
  const upgradeMutation = useUpgradeGuest();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [notice, setNotice] = useState<Notice>(null);
  // RGPD: playing as a guest was accepted for a guest profile; an account is a new consent.
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [consentVisible, setConsentVisible] = useState(false);

  const fail = (text: string) => setNotice({ text, ok: false });

  const submit = async () => {
    if (upgradeMutation.isPending) return;
    if (!username.trim() || !email.trim() || !password || !confirmation) return fail(t('errRequired'));
    const error = checkUsername(username) ?? checkEmail(email) ?? checkNewPassword(password, confirmation);
    if (error) return fail(t(error));
    if (!acceptTerms) return fail(tCommon('errAcceptTerms'));

    try {
      await upgradeMutation.mutateAsync({
        username: username.trim(),
        email: normalizeEmail(email),
        passwordCrea: password,
        acceptTerms: true,
      });
      onDone();
    } catch (e) {
      fail(extractApiError(e).message);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.label}>{t('upgradeTitle').toUpperCase()}</Text>
      <Text style={styles.body}>{t('upgradeIntro')}</Text>
      <Field
        label={t('username')}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="username-new"
        textContentType="username"
        maxLength={20}
        hint={t('usernameRules')}
      />
      <Field
        label={t('email')}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
      />
      <Field
        label={t('password')}
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
        onSubmitEditing={submit}
      />
      <Check
        label={tCommon('acceptTerms')}
        checked={acceptTerms}
        onToggle={() => (acceptTerms ? setAcceptTerms(false) : setConsentVisible(true))}
      />
      <FormNotice notice={notice} />
      <PrimaryButton
        label={upgradeMutation.isPending ? t('pending') : t('upgradeSubmit')}
        onPress={submit}
        disabled={upgradeMutation.isPending}
        size="medium"
      />
      <ConsentModal
        visible={consentVisible}
        onAccept={() => {
          setConsentVisible(false);
          setAcceptTerms(true);
        }}
        onRefuse={() => {
          setConsentVisible(false);
          setAcceptTerms(false);
        }}
      />
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
  body: {
    color: KS.inkDim,
    fontFamily: TYPO.ui,
    fontSize: SIZES.body,
    lineHeight: SIZES.body * 1.5,
    marginBottom: 6,
  },
});
