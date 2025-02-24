import React, { useState, useEffect  } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, AppRegistry, TextInput, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { motTraduit } from '@/components/translationHelper';
import { useLanguageStore } from '../../store/languageStore';

import { FontAwesomeWrapper } from '@/components/FontAwesomeWrapper';
import { faCaretDown, faCheck, faEdit, faTimes } from '@fortawesome/free-solid-svg-icons';
import { faCaretUp } from '@fortawesome/free-solid-svg-icons';

const element = () => (
    <View>
      <FontAwesomeWrapper icon={faCaretDown} />
      <FontAwesomeWrapper icon={faCaretUp} />
    </View>
);

interface CompteParamProps {
    title: string;
    children: React.ReactNode;
}
   const CompteParam: React.FC<CompteParamProps> = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    const toggleAccordion = () => {
      setIsOpen(!isOpen);
    };
     return (
      <View style={styles.container}>
        <TouchableOpacity onPress={toggleAccordion} style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <FontAwesomeWrapper icon={isOpen ? faCaretUp : faCaretDown} />
        </TouchableOpacity>
        {isOpen && <View style={styles.content}>{children}</View>}
      </View>
    );
};
  const CompteContainer = () => {
    const { langIndex, setLanguage } = useLanguageStore();
    const [username, setUsername] = useState<string | null>(null);
    const [userChange, setUserChange] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isGuest, setIsGuest] = useState<boolean>(false);
    const apiUrl = process.env.EXPO_PUBLIC_API_URL;

    const handleLanguageChange = async (value: number) => {
       await setLanguage(value);
    };

    useEffect(() => {
      const fetchUsername = async () => {
          const isGuest = await AsyncStorage.getItem('isGuest');
          setIsGuest(isGuest === 'true');
          const storedUsername = await AsyncStorage.getItem('username');
          setUsername(storedUsername);
      };
      fetchUsername();
  }, []);

  // Fonction pour activer le mode édition
  const startEditing = () => {
      setUserChange(username || '');
      setIsEditing(true);
  };

  // Fonction pour annuler la modification
  const cancelEditing = () => {
      setIsEditing(false);
      setUserChange(username || '');
  };

  // Fonction pour appliquer la mise à jour du nom d'utilisateur
  const updateUsername = async () => {
      setLoading(true);
      try {
          const token = await AsyncStorage.getItem('userToken');
          // Appelle l'API pour mettre à jour le nom d'utilisateur
          const response = await fetch(`${apiUrl}/users/update-username/${username}`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `${token}`,
              },
              body: JSON.stringify({ newUsername: userChange }),
          });

          if (!response.ok) {
              throw new Error('Erreur lors de la mise à jour du nom d\'utilisateur.');
          }

          // Met à jour AsyncStorage et l'état local
          await AsyncStorage.setItem('username', userChange);
          setUsername(userChange);
          setIsEditing(false);
      } catch (error) {
          console.error(error);
      }
      setLoading(false);
  };

    return (
        <View>
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
                            <TouchableOpacity style={styles.applyButton} onPress={updateUsername} disabled={loading}>
                                {loading ? <ActivityIndicator color="white" /> : <FontAwesomeWrapper icon={faCheck} />}
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.cancelButton} onPress={cancelEditing}>
                                <FontAwesomeWrapper icon={faTimes} />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.editButton} onPress={startEditing}>
                            <FontAwesomeWrapper icon={faEdit} />
                        </TouchableOpacity>
                    )
                  ) : (
                    <Text style={{marginBottom: 10}}>{motTraduit(langIndex, 59)}</Text>
                  )}
                <Text>{motTraduit(langIndex, 25)} :</Text>
                <View style={styles.radioContainer}>
                    <TouchableOpacity 
                        style={styles.radioOption} 
                        onPress={() => handleLanguageChange(0)}
                    >
                        <View style={[styles.radio, langIndex === 0 && styles.radioSelected]} />
                        <Text>{motTraduit(langIndex, 26)}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.radioOption} 
                        onPress={() => handleLanguageChange(1)}
                    >
                        <View style={[styles.radio, langIndex === 1 && styles.radioSelected]} />
                        <Text>{motTraduit(langIndex, 27)}</Text>
                    </TouchableOpacity>
                </View>
            </CompteParam>
        </View>
    );
};

const styles = StyleSheet.create({
 container: {
   marginBottom: 10,
   borderWidth: 1,
   borderColor: '#ccc',
   borderRadius: 5,
 },
 header: {
    flexDirection: 'row',
   justifyContent: 'space-between',
   padding: 10,
   backgroundColor: '#f1f1f1',
 },
 title: {
   fontSize: 16,
 },
 content: {
   padding: 10,
   backgroundColor: '#fff',
 },
 inputContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  borderBottomWidth: 1,
  borderBottomColor: '#ccc',
  marginVertical: 10,
},
input: {
  flex: 1,
  padding: 10,
  fontSize: 16,
},
buttonContainer: {
  flexDirection: 'row',
  padding : 5
},
editButton: {
  marginLeft: 10,
  padding: 8,
  backgroundColor: '#007bff',
  borderRadius: 5,
},
applyButton: {
  padding: 8,
  backgroundColor: 'green',
  borderRadius: 5,
  marginRight: 5,
},
cancelButton: {
  padding: 8,
  backgroundColor: 'red',
  borderRadius: 5,
},
 radioContainer: {
  marginTop: 10,
},
radioOption: {
  flexDirection: 'row',
  alignItems: 'center',
  marginVertical: 8,
},
radio: {
  height: 20,
  width: 20,
  borderRadius: 10,
  borderWidth: 2,
  borderColor: '#000',
  marginRight: 10,
},
radioSelected: {
  backgroundColor: '#000',
},
});

export default CompteContainer;

AppRegistry.registerComponent('KILLSPY', () => element);