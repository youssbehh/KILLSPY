import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Button } from '@rneui/themed';
import { useMutation } from '@tanstack/react-query';
import { motTraduit } from '@/components/translationHelper';
import { useLanguageStore } from '../../store/languageStore';
import { FontAwesomeWrapper } from '@/components/FontAwesomeWrapper';
import { faCaretDown, faCheck, faEdit, faTimes, faCaretUp } from '@fortawesome/free-solid-svg-icons';
import LoadingOverlay from '@/components/LoadingOverlay';
import { useAuthStore } from '@/src/stores/authStore';
import { updateUsername as apiUpdateUsername } from '@/src/api/users';
import { extractApiError } from '@/src/api/client';

interface CompteParamProps {
  title: string;
  children: React.ReactNode;
}

const CompteParam: React.FC<CompteParamProps> = ({ title, children }) => {
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

  const startEditing = () => {
    setUserChange(username);
    setIsEditing(true);
    setErrorMsg('');
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setUserChange(username);
    setErrorMsg('');
  };

  return (
    <View>
      <LoadingOverlay isLoading={updateUsernameMutation.isPending} />
      <CompteParam title={motTraduit(langIndex, 20)}>
        <Text>{motTraduit(langIndex, 46)} :</Text>
        <TextInput
          style={styles.input}
          placeholder={username || motTraduit(langIndex, 58)}
          value={userChange}
          onChangeText={setUserChange}
          editable={isEditing}
          autoCapitalize="none"
        />
        {!isGuest ? (
          isEditing ? (
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => updateUsernameMutation.mutate(userChange)}
                disabled={updateUsernameMutation.isPending}
              >
                {updateUsernameMutation.isPending ? <ActivityIndicator color="white" /> : <FontAwesomeWrapper icon={faCheck} />}
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={cancelEditing}>
                <FontAwesomeWrapper icon={faTimes} />
              </TouchableOpacity>
            </View>
          ) : (
            <Button onPress={startEditing}><FontAwesomeWrapper icon={faEdit} /></Button>
          )
        ) : (
          <Button>{motTraduit(langIndex, 70)}</Button>
        )}
        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

        <Text style={{ marginTop: 5 }}>{motTraduit(langIndex, 25)} :</Text>
        <View style={styles.radioContainer}>
          <TouchableOpacity style={styles.radioOption} onPress={() => setLanguage(0)}>
            <View style={[styles.radio, langIndex === 0 && styles.radioSelected]} />
            <Text>{motTraduit(langIndex, 26)}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.radioOption} onPress={() => setLanguage(1)}>
            <View style={[styles.radio, langIndex === 1 && styles.radioSelected]} />
            <Text>{motTraduit(langIndex, 27)}</Text>
          </TouchableOpacity>
        </View>
      </CompteParam>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 5 },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 10, backgroundColor: '#f1f1f1' },
  title: { fontSize: 16 },
  content: { padding: 10, backgroundColor: '#fff' },
  input: { flex: 1, padding: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, fontSize: 16, marginBottom: 10, marginTop: 10 },
  buttonContainer: { flexDirection: 'row', padding: 5 },
  applyButton: { padding: 8, backgroundColor: 'green', borderRadius: 5, marginRight: 5 },
  cancelButton: { padding: 8, backgroundColor: 'red', borderRadius: 5 },
  radioContainer: { marginTop: 10 },
  radioOption: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  radio: { height: 20, width: 20, borderRadius: 10, borderWidth: 2, borderColor: '#000', marginRight: 10 },
  radioSelected: { backgroundColor: '#000' },
  errorText: { color: 'red', marginTop: 6 },
});

export default CompteContainer;
