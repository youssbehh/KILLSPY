import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet,
} from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { motTraduit } from '@/components/translationHelper';
import { useLanguageStore } from '../../store/languageStore';
import LoadingOverlay from '@/components/LoadingOverlay';
import { useAuthStore } from '@/src/stores/authStore';
import { updateUsername as apiUpdateUsername } from '@/src/api/users';
import { extractApiError } from '@/src/api/client';
import { KSAccordion } from './KSAccordion';
import { KS } from '@/src/theme/colors';
import { TYPO, SIZES } from '@/src/theme/typography';

const LANGS = ['Français', 'English'];

const CompteContainer = () => {
  const { langIndex, setLanguage } = useLanguageStore();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const [userChange, setUserChange] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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

  return (
    <KSAccordion title={motTraduit(langIndex, 20)}>
      <LoadingOverlay isLoading={updateUsernameMutation.isPending} />

      {/* Username row */}
      <Text style={styles.label}>{motTraduit(langIndex, 46)}</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, !isEditing && styles.inputDisabled]}
          placeholder={username || motTraduit(langIndex, 58)}
          placeholderTextColor={KS.inkFaint}
          value={isEditing ? userChange : username}
          onChangeText={setUserChange}
          editable={isEditing}
          autoCapitalize="none"
        />
        {!isGuest && (
          isEditing ? (
            <View style={styles.btnRow}>
              <Pressable
                style={[styles.btn, { backgroundColor: KS.live + '22', borderColor: KS.live }]}
                onPress={() => updateUsernameMutation.mutate(userChange)}
                disabled={updateUsernameMutation.isPending}
              >
                {updateUsernameMutation.isPending
                  ? <ActivityIndicator color={KS.live} size="small" />
                  : <Text style={[styles.btnText, { color: KS.live }]}>✓</Text>}
              </Pressable>
              <Pressable
                style={[styles.btn, { backgroundColor: KS.danger + '22', borderColor: KS.danger }]}
                onPress={() => { setIsEditing(false); setUserChange(username); setErrorMsg(''); }}
              >
                <Text style={[styles.btnText, { color: KS.danger }]}>✕</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={[styles.btn, { backgroundColor: KS.primary + '22', borderColor: KS.primary }]}
              onPress={() => { setUserChange(username); setIsEditing(true); setErrorMsg(''); }}
            >
              <Text style={[styles.btnText, { color: KS.primary }]}>✎</Text>
            </Pressable>
          )
        )}
      </View>
      {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}

      {/* Language */}
      <Text style={[styles.label, { marginTop: 8 }]}>{motTraduit(langIndex, 25)}</Text>
      <View style={styles.langRow}>
        {LANGS.map((lng, i) => (
          <Pressable
            key={i}
            onPress={() => setLanguage(i)}
            style={[styles.langChip, langIndex === i && styles.langChipActive]}
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
    height: 40,
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
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 4,
  },
  btnText: { fontFamily: TYPO.mono, fontSize: 14 },
  error: { color: KS.danger, fontFamily: TYPO.mono, fontSize: SIZES.monoSm, marginTop: 4 },
  langRow: { flexDirection: 'row', gap: 8 },
  langChip: {
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
