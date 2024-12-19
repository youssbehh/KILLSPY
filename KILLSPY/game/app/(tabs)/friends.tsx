import React, { useState } from 'react';
import { motTraduit } from '@/components/translationHelper';
import { AppRegistry, StyleSheet, ScrollView } from 'react-native';
import Leaderboard from '../sousfriends/leaderboard';
import ProfilmmrScreen from '../sousfriends/profilmmr';
import { Text, View } from '@/components/Themed';
import { appVersion } from '../../config';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserSecret } from '@fortawesome/free-solid-svg-icons';

const element = () => (
  <View>
    <FontAwesomeIcon icon={faUserSecret} />
  </View>
);


export default function TabOneScreen() {
  const [langIndex, setLangIndex] = useState(0);

  return (
    <View style={styles.container}>
      <Text style={styles.titleh1}>{motTraduit(langIndex, 10)} <FontAwesomeIcon icon={faUserSecret} /></Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <ScrollView>
        <View style={styles.leaderboardcontainer}>
          <Leaderboard/>
        </View>
        <View style={styles.Profilmmrcontainer}>
          <ProfilmmrScreen/>
        </View>
      </ScrollView>
      <Text style={styles.footer}>MIMIR Studio 2024 / V. {appVersion}</Text>
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
    marginTop: 10,
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

  leaderboardcontainer:{

  },
  Profilmmrcontainer:{

  },
  
  footer: {
    marginTop: 20,
    fontSize: 16,
    color: '#888',
  },
});

AppRegistry.registerComponent('KILLSPY', () => element);