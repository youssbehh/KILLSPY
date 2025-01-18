import React, { useState } from 'react';
import { AppRegistry, StyleSheet } from 'react-native';
import { motTraduit } from '@/components/translationHelper';
import { Text, View } from '@/components/Themed';
import { useLanguageStore } from '../../store/languageStore';

import { FontAwesomeWrapper } from '@/components/FontAwesomeWrapper';
import { faHandshake, faUserMinus, faUserPlus, faUserXmark, faUserGear, faUserLock, faUserCheck, faLockOpen, faHandFist } from '@fortawesome/free-solid-svg-icons';


const element = () => (
  <View>
    <FontAwesomeWrapper icon={faHandshake} />
    <FontAwesomeWrapper icon={faUserMinus} />
    <FontAwesomeWrapper icon={faUserPlus} />
    <FontAwesomeWrapper icon={faUserXmark} />
    <FontAwesomeWrapper icon={faUserGear} />
    <FontAwesomeWrapper icon={faUserLock} />
    <FontAwesomeWrapper icon={faUserCheck} />
    <FontAwesomeWrapper icon={faLockOpen} />
    <FontAwesomeWrapper icon={faHandFist} />
  </View>
);

export default function FriendslistScreen() {
  const { langIndex } = useLanguageStore();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{motTraduit(langIndex, 18)}</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});

AppRegistry.registerComponent('KILLSPY', () => element);