import React, { useState } from 'react';
import { motTraduit } from '@/components/translationHelper';
import { AppRegistry, StyleSheet, ScrollView } from 'react-native';
import Leaderboard from '../sousfriends/leaderboard';
import ProfilmmrScreen from '../sousfriends/profilmmr';
import FriendslistScreen from '../sousfriends/friendslist';
import { Text, View } from '@/components/Themed';
import { appVersion } from '../../config';
import { useLanguageStore } from '../../store/languageStore';

import { FontAwesomeWrapper } from '@/components/FontAwesomeWrapper';
import { faUserSecret } from '@fortawesome/free-solid-svg-icons';

export default function TabOneScreen() {
  const { langIndex } = useLanguageStore();

  return (
    <View style={styles.container}>
      <Text style={styles.titleh1}>{motTraduit(langIndex, 10)} <FontAwesomeWrapper icon={faUserSecret} size={30} /></Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <ScrollView>
        <View style={styles.componantcontainer}>
          <View style={styles.leaderboardcontainer}>
            <Leaderboard/>
          </View>
          <View style={styles.profilmmrcontainer}>
            <ProfilmmrScreen/>
          </View>
        </View>
        <View style={styles.friendslistcontainer}>
            <FriendslistScreen/>
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

  componantcontainer:{
    flexWrap:'wrap',
    flexDirection:'row',
  },
  leaderboardcontainer:{
    padding: 10,
    margin: 10,
  },
  profilmmrcontainer:{
    padding: 10,
    margin: 10,
  },
  friendslistcontainer:{
    padding: 10,
    margin: 10,
  },

  footer: {
    marginTop: 20,
    fontSize: 16,
    color: '#888',
    marginBottom: 5,
  },
});

AppRegistry.registerComponent('KILLSPY', () => TabOneScreen);