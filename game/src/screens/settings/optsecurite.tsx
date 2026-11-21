import React, { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { motTraduit } from '@/components/translationHelper';
import { useLanguageStore } from '@/src/stores/languageStore';
import { useAuthStore } from '@/src/stores/authStore';
import { useChangePassword } from '@/src/hooks/useAccount';
import { extractApiError } from '@/src/api/client';
import { useLocalT } from '@/src/i18n/local';
import { Field, FormNotice, Notice } from '@/src/components/ks/FormField';
import { PrimaryButton } from '@/src/components/ks/PrimaryButton';
import { ACCOUNT_STRINGS } from '@/src/screens/account/strings';
import { checkNewPassword } from '@/src/screens/account/rules';
import { KSAccordion } from './KSAccordion';
import { KS } from '@/src/theme/colors';
import { TYPO, SIZES } from '@/src/theme/typography';

const ChangePasswordForm = () => {
  const t = useLocalT(ACCOUNT_STRINGS);
  const changeMutation = useChangePassword();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [notice, setNotice] = useState<Notice>(null);

  const fail = (text: string) => setNotice({ text, ok: false });

  const submit = async () => {
    if (changeMutation.isPending) return;
    if (!currentPassword || !newPassword || !confirmation) return fail(t('errRequired'));
    const error = checkNewPassword(newPassword, confirmation);
    if (error) return fail(t(error));
    if (newPassword === currentPassword) return fail(t('errSamePassword'));

    try {
      await changeMutation.mutateAsync({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmation('');
      setNotice({ text: t('changeDone'), ok: true });
    } catch (e) {
      fail(extractApiError(e).message);
    }
  };

  return (
    <>
      <Text style={styles.body}>{t('changeIntro')}</Text>
      <Field
        label={t('currentPassword')}
        value={currentPassword}
        onChangeText={setCurrentPassword}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
        maxLength={72}
      />
      <Field
        label={t('newPassword')}
        value={newPassword}
        onChangeText={setNewPassword}
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
      <FormNotice notice={notice} />
      <PrimaryButton
        label={changeMutation.isPending ? t('pending') : t('changeSubmit')}
        onPress={submit}
        disabled={changeMutation.isPending}
        size="medium"
      />
    </>
  );
};

const SecuriteContainer = () => {
  const { langIndex } = useLanguageStore();
  const t = useLocalT(ACCOUNT_STRINGS);
  const isGuest = useAuthStore((s) => s.user?.guest ?? false);

  return (
    <KSAccordion title={motTraduit(langIndex, 21)}>
      {/* A guest has no password to change. */}
      {isGuest ? <Text style={styles.body}>{t('changeGuest')}</Text> : <ChangePasswordForm />}
    </KSAccordion>
  );
};

const styles = StyleSheet.create({
  body: {
    color: KS.inkDim,
    fontFamily: TYPO.ui,
    fontSize: SIZES.body,
    lineHeight: SIZES.body * 1.5,
  },
});

export default SecuriteContainer;
