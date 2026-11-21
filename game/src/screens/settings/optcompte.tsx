import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet,
} from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { motTraduit } from '@/components/translationHelper';
import { useLanguageStore } from '@/src/stores/languageStore';
import { useAuthStore } from '@/src/stores/authStore';
import { updateUsername as apiUpdateUsername } from '@/src/api/users';
import { extractApiError } from '@/src/api/client';
import { useLocalT } from '@/src/i18n/local';
import { FormNotice } from '@/src/components/ks/FormField';
import { ACCOUNT_STRINGS } from '@/src/screens/account/strings';
import { checkUsername } from '@/src/screens/account/rules';
import { EmailVerification } from '@/src/screens/account/EmailVerification';
import { GuestUpgradeForm } from '@/src/screens/account/GuestUpgradeForm';
import { KSAccordion } from './KSAccordion';
import { KS } from '@/src/theme/colors';
import { TYPO, SIZES } from '@/src/theme/typography';

const LANGS = ['Français', 'English'];

const CompteContainer = () => {
  const { langIndex, setLanguage } = useLanguageStore();
  const t = useLocalT(ACCOUNT_STRINGS);
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const [userChange, setUserChange] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  // Set when the guest form succeeds: by then the form itself is gone (the user is no longer a guest).
  const [justUpgraded, setJustUpgraded] = useState(false);

  const updateUsernameMutation = useMutation({
    mutationFn: apiUpdateUsername,
    onSuccess: (updated) => {
      updateUser({ username: updated.username });
      setIsEditing(false);
      setErrorMsg('');
    },
    onError: (e) => setErrorMsg(extractApiError(e).message),
  });

  const isGuest = user?.guest ?? false;
  const username = user?.username ?? '';

  const saveUsername = () => {
    if (updateUsernameMutation.isPending) return;
    const next = userChange.trim();
    if (next === username) {
      setIsEditing(false);
      setErrorMsg('');
      return;
    }
    const error = checkUsername(next);
    if (error) return setErrorMsg(t(error));
    updateUsernameMutation.mutate(next);
  };

  return (
    <KSAccordion title={motTraduit(langIndex, 20)}>
      {justUpgraded && !isGuest && <FormNotice notice={{ text: t('upgradeDone'), ok: true }} />}

      {/* Username row (a guest's name is chosen when the account is created, below) */}
      <Text style={styles.label}>{motTraduit(langIndex, 46)}</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, !isEditing && styles.inputDisabled]}
          placeholder={username || motTraduit(langIndex, 58)}
          placeholderTextColor={KS.inkFaint}
          selectionColor={KS.primary}
          value={isEditing ? userChange : username}
          onChangeText={setUserChange}
          editable={isEditing}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
          maxLength={20}
          onSubmitEditing={saveUsername}
          accessibilityLabel={motTraduit(langIndex, 46)}
        />
        {!isGuest && (
          isEditing ? (
            <View style={styles.btnRow}>
              <Pressable
                style={[styles.btn, { backgroundColor: KS.live + '22', borderColor: KS.live }]}
                onPress={saveUsername}
                disabled={updateUsernameMutation.isPending}
                accessibilityRole="button"
                accessibilityLabel={t('usernameSave')}
                accessibilityState={{ disabled: updateUsernameMutation.isPending }}
              >
                {updateUsernameMutation.isPending
                  ? <ActivityIndicator color={KS.live} size="small" />
                  : <Text style={[styles.btnText, { color: KS.live }]}>✓</Text>}
              </Pressable>
              <Pressable
                style={[styles.btn, { backgroundColor: KS.danger + '22', borderColor: KS.danger }]}
                onPress={() => { setIsEditing(false); setUserChange(username); setErrorMsg(''); }}
                disabled={updateUsernameMutation.isPending}
                accessibilityRole="button"
                accessibilityLabel={t('usernameCancel')}
              >
                <Text style={[styles.btnText, { color: KS.danger }]}>✕</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={[styles.btn, { backgroundColor: KS.primary + '22', borderColor: KS.primary }]}
              onPress={() => { setUserChange(username); setIsEditing(true); setErrorMsg(''); }}
              accessibilityRole="button"
              accessibilityLabel={t('usernameEdit')}
            >
              <Text style={[styles.btnText, { color: KS.primary }]}>✎</Text>
            </Pressable>
          )
        )}
      </View>
      {errorMsg ? (
        <Text style={styles.error} accessibilityLiveRegion="polite" accessibilityRole="alert">
          {errorMsg}
        </Text>
      ) : null}

      <View style={styles.divider} />

      {/* A guest has no e-mail to verify: it gets the "create my account" form instead. */}
      {isGuest ? <GuestUpgradeForm onDone={() => setJustUpgraded(true)} /> : <EmailVerification />}

      <View style={styles.divider} />

      {/* Language */}
      <Text style={styles.label}>{motTraduit(langIndex, 25)}</Text>
      <View style={styles.langRow}>
        {LANGS.map((lng, i) => (
          <Pressable
            key={lng}
            onPress={() => setLanguage(i)}
            style={[styles.langChip, langIndex === i && styles.langChipActive]}
            accessibilityRole="button"
            accessibilityLabel={lng}
            accessibilityState={{ selected: langIndex === i }}
          >
            <Text style={[styles.langText, langIndex === i && styles.langTextActive]}>{lng}</Text>
          </Pressable>
        ))}
      </View>
    </KSAccordion>
  );
};

const styles = StyleSheet.create({
  label: {
    color: KS.inkDim,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoSm,
    letterSpacing: SIZES.monoSm * 0.18,
    marginBottom: 4,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    flex: 1,
    height: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: KS.hairSoft,
    backgroundColor: KS.surface,
    color: KS.ink,
    fontFamily: TYPO.ui,
    fontSize: SIZES.body,
  },
  inputDisabled: { color: KS.inkDim },
  btnRow: { flexDirection: 'row', gap: 6 },
  btn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 4,
  },
  btnText: { fontFamily: TYPO.mono, fontSize: SIZES.monoLg },
  error: { color: KS.danger, fontFamily: TYPO.mono, fontSize: SIZES.monoSm, marginTop: 4 },
  divider: { height: 1, backgroundColor: KS.divider, marginVertical: 6 },
  langRow: { flexDirection: 'row', gap: 8 },
  langChip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: KS.hairSoft,
    backgroundColor: KS.surface,
  },
  langChipActive: { borderColor: KS.primary, backgroundColor: KS.primary + '18' },
  langText: {
    color: KS.inkDim,
    fontFamily: TYPO.display,
    fontSize: SIZES.labelLg,
    letterSpacing: SIZES.labelLg * 0.08,
  },
  langTextActive: { color: KS.primary },
});

export default CompteContainer;
