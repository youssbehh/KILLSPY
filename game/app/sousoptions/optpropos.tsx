import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@rneui/themed';
import { useMutation } from '@tanstack/react-query';
import { motTraduit } from '@/components/translationHelper';
import { useLanguageStore } from '../../store/languageStore';
import AlertModal from '@/components/AlertModal';
import LoadingOverlay from '@/components/LoadingOverlay';
import { FontAwesomeWrapper } from '@/components/FontAwesomeWrapper';
import { faCaretDown, faCaretUp } from '@fortawesome/free-solid-svg-icons';
import { useAuthStore } from '@/src/stores/authStore';
import { deleteAccount } from '@/src/api/users';
import { extractApiError } from '@/src/api/client';

interface ProposParamProps {
  title: string;
  children: React.ReactNode;
}
const ProposParam: React.FC<ProposParamProps> = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setIsOpen(!isOpen)} style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <FontAwesomeWrapper icon={isOpen ? faCaretUp : faCaretDown} />
      </TouchableOpacity>
      {isOpen && <View style={styles.content}>{children}</View>}
    </View>
  );
};

const ProposContainer = () => {
  const { langIndex } = useLanguageStore();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const isGuest = user?.guest ?? false;
  const [modalVisible, setModalVisible] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [isCountdownActive, setIsCountdownActive] = useState(false);

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
    onError: (e) => {
      Alert.alert('Erreur', extractApiError(e).message);
    },
  });

  const handleDeleteAccount = () => {
    setModalVisible(true);
    setCountdown(5);
    setIsCountdownActive(true);
  };

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isCountdownActive && countdown > 0) {
      timer = setInterval(() => setCountdown((p) => p - 1), 1000);
    } else if (countdown === 0) {
      setIsCountdownActive(false);
    }
    return () => clearInterval(timer);
  }, [isCountdownActive, countdown]);

  return (
    <View>
      <LoadingOverlay isLoading={deleteMutation.isPending} />
      <ProposParam title={motTraduit(langIndex, 29)}>
        <Text style={styles.title}>Informations sur la protection des données</Text>
        <Text style={styles.contentText}>
          Nous nous engageons à protéger vos données personnelles. Voici les informations que nous collectons et conservons :
        </Text>
        <Text style={styles.contentText}>1. Nom d'utilisateur : Utilisé pour identifier votre compte.</Text>
        <Text style={styles.contentText}>2. Adresse e-mail : Communication et récupération de compte.</Text>
        <Text style={styles.contentText}>3. Historique de jeu : Performances et statistiques.</Text>
        <Text style={styles.contentText}>4. Données de connexion : Sécurité et analyse.</Text>
        <Text style={styles.contentText}>5. Préférences utilisateur : Personnalisation.</Text>
        <Text style={styles.contentText}>
          Nous ne partageons pas vos données avec des tiers sans votre consentement, sauf si la loi l'exige.
        </Text>
        {!isGuest && (
          <Button title={motTraduit(langIndex, 68)} onPress={handleDeleteAccount} />
        )}
        <AlertModal
          visible={modalVisible}
          text1={motTraduit(langIndex, 67)}
          text2={isCountdownActive ? `Attendez ${countdown} secondes...` : ''}
          error1Button={motTraduit(langIndex, 65)}
          onPressError1={isCountdownActive ? () => {} : () => deleteMutation.mutate()}
          disabledError1={isCountdownActive}
          button1={motTraduit(langIndex, 66)}
          onPress1={() => setModalVisible(false)}
        />
      </ProposParam>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 5 },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 10, backgroundColor: '#f1f1f1' },
  title: { fontSize: 16, marginBottom: 10 },
  content: { padding: 10, backgroundColor: '#fff' },
  contentText: { padding: 5 },
});

export default ProposContainer;
