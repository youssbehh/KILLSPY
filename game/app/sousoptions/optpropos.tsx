import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { motTraduit } from '@/components/translationHelper';
import { useLanguageStore } from '../../store/languageStore';
import AlertModal from '@/components/AlertModal';
import LoadingOverlay from '@/components/LoadingOverlay';
import { useAuthStore } from '@/src/stores/authStore';
import { deleteAccount } from '@/src/api/users';
import { extractApiError } from '@/src/api/client';
import { KSAccordion } from './KSAccordion';
import { KS } from '@/src/theme/colors';
import { TYPO, SIZES } from '@/src/theme/typography';

const PRIVACY_ITEMS = [
  "Nom d'utilisateur — identification du compte.",
  'Adresse e-mail — communication et récupération.',
  'Historique de jeu — performances et statistiques.',
  'Données de connexion — sécurité et analyse.',
  'Préférences utilisateur — personnalisation.',
];

const ProposContainer = () => {
  const { langIndex } = useLanguageStore();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const isGuest = user?.guest ?? false;
  const [modalVisible, setModalVisible] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [counting, setCounting] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!user) throw new Error('Aucun utilisateur connecté.');
      return deleteAccount(user.id);
    },
    onSuccess: async () => {
      await clearSession();
      setModalVisible(false);
      Alert.alert('Compte supprimé', 'Votre compte a été archivé. Suppression définitive dans 30 jours.');
      router.replace('/');
    },
    onError: (e) => Alert.alert('Erreur', extractApiError(e).message),
  });

  useEffect(() => {
    if (!counting) return;
    if (countdown === 0) { setCounting(false); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [counting, countdown]);

  const handleOpen = () => { setModalVisible(true); setCountdown(5); setCounting(true); };

  return (
    <KSAccordion title={motTraduit(langIndex, 29)}>
      <LoadingOverlay isLoading={deleteMutation.isPending} />

      <Text style={styles.heading}>// PROTECTION DES DONNÉES</Text>
      <Text style={styles.intro}>
        Nous nous engageons à protéger vos données personnelles. Voici ce que nous collectons :
      </Text>
      {PRIVACY_ITEMS.map((item, i) => (
        <View key={i} style={styles.bulletRow}>
          <Text style={styles.bullet}>›</Text>
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
      <Text style={[styles.intro, { marginTop: 8 }]}>
        Vos données ne sont pas partagées avec des tiers sans votre consentement.
      </Text>

      {!isGuest && (
        <Pressable
          onPress={handleOpen}
          style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.75 }]}
        >
          <Text style={styles.deleteBtnText}>{motTraduit(langIndex, 68)}</Text>
        </Pressable>
      )}

      <AlertModal
        visible={modalVisible}
        text1={motTraduit(langIndex, 67)}
        text2={counting ? `Attendez ${countdown}s...` : ''}
        error1Button={motTraduit(langIndex, 65)}
        onPressError1={counting ? () => {} : () => deleteMutation.mutate()}
        disabledError1={counting}
        button1={motTraduit(langIndex, 66)}
        onPress1={() => setModalVisible(false)}
      />
    </KSAccordion>
  );
};

const styles = StyleSheet.create({
  heading: {
    color: KS.primary,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoSm,
    letterSpacing: SIZES.monoSm * 0.32,
    marginBottom: 8,
  },
  intro: {
    color: KS.inkDim,
    fontFamily: TYPO.ui,
    fontSize: SIZES.bodySm,
    lineHeight: SIZES.bodySm * 1.55,
  },
  bulletRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  bullet: { color: KS.primary, fontFamily: TYPO.mono, fontSize: SIZES.body },
  bulletText: { flex: 1, color: KS.inkDim, fontFamily: TYPO.ui, fontSize: SIZES.bodySm, lineHeight: SIZES.bodySm * 1.5 },
  deleteBtn: {
    marginTop: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: KS.danger,
    backgroundColor: KS.danger + '14',
    alignItems: 'center',
  },
  deleteBtnText: {
    color: KS.danger,
    fontFamily: TYPO.display,
    fontSize: SIZES.labelLg,
    letterSpacing: SIZES.labelLg * 0.1,
  },
});

export default ProposContainer;
