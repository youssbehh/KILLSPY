import React, { useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Button, Pressable, StyleSheet } from 'react-native';
import { motTraduit } from '@/components/translationHelper';
import EditScreenInfo from '@/components/EditScreenInfo';
import { Text, View } from '@/components/Themed';

export default function GameChoiceScreen() {
  const [langIndex, setLangIndex] = useState(0);

  return (
    <View style={styles.container}>
      <Text style={styles.titleh1}>KILLSPY</Text>
      <Text style={styles.titleh2}>{motTraduit(langIndex, 11)} <Text style={styles.boldText}>LoremIpsum57</Text></Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <EditScreenInfo path="app/(tabs)/two.tsx" />
      <Pressable>
      <FontAwesome icon="fa-solid fa-play" />
     </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleh1: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  titleh2: {
    fontSize: 20,
  },
  boldText: {
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
