import React, { useState } from 'react';
import { AppRegistry, StyleSheet } from 'react-native';
import { motTraduit } from '@/components/translationHelper';
import { Text, View } from '@/components/Themed';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHandshake } from '@fortawesome/free-solid-svg-icons';
import { faUserMinus } from '@fortawesome/free-solid-svg-icons';
import { faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { faUserXmark } from '@fortawesome/free-solid-svg-icons';
import { faUserGear } from '@fortawesome/free-solid-svg-icons';
import { faUserLock } from '@fortawesome/free-solid-svg-icons';
import { faUserCheck } from '@fortawesome/free-solid-svg-icons';
import { faLockOpen } from '@fortawesome/free-solid-svg-icons';
import { faHandFist } from '@fortawesome/free-solid-svg-icons';

const element = () => (
  <View>
    <FontAwesomeIcon icon={faHandshake} />
    <FontAwesomeIcon icon={faUserMinus} />
    <FontAwesomeIcon icon={faUserPlus} />
    <FontAwesomeIcon icon={faUserXmark} />
    <FontAwesomeIcon icon={faUserGear} />
    <FontAwesomeIcon icon={faUserLock} />
    <FontAwesomeIcon icon={faUserCheck} />
    <FontAwesomeIcon icon={faLockOpen} />
    <FontAwesomeIcon icon={faHandFist} />
  </View>
);

export default function FriendslistScreen() {
  const [langIndex, setLangIndex] = useState(0);

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