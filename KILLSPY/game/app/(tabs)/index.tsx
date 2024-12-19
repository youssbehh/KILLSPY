import React, { useState } from 'react';
import { AppRegistry, ScrollView } from 'react-native';
import { Button, Pressable, StyleSheet } from 'react-native';
import { motTraduit } from '@/components/translationHelper';
import { Text, View } from '@/components/Themed';
import { Card } from '@rneui/themed';
import { appVersion } from '../../config';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot } from '@fortawesome/free-solid-svg-icons';
import { faBolt } from '@fortawesome/free-solid-svg-icons';
import { faTrophy } from '@fortawesome/free-solid-svg-icons';
import { faUsersViewfinder } from '@fortawesome/free-solid-svg-icons';

const element = () => (
  <View>
    <FontAwesomeIcon icon={faRobot} />
    <FontAwesomeIcon icon={faBolt} />
    <FontAwesomeIcon icon={faTrophy} />
    <FontAwesomeIcon icon={faUsersViewfinder} />
  </View>
);

export default function GameChoiceScreen() {
  const [langIndex, setLangIndex] = useState(0);

  return (
    <View style={styles.container}>
      <Text style={styles.titleh1}>KILLSPY</Text>
      <Text style={styles.titleh2}>{motTraduit(langIndex, 11)} <Text style={styles.boldText}>LoremIpsum57</Text></Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <ScrollView style={styles.cardStyle}>
        <Pressable>
          <Card containerStyle={{ marginTop: 15 }}>
              <Card.Title>{motTraduit(langIndex, 12)}</Card.Title>
              <Card.Divider />
              <FontAwesomeIcon icon={faRobot} />
          </Card>
        </Pressable>
        <Pressable>
          <Card containerStyle={{ marginTop: 15 }}>
              <Card.Title>{motTraduit(langIndex, 13)}</Card.Title>
              <Card.Divider />
              <FontAwesomeIcon icon={faBolt} />
          </Card>
        </Pressable>
        <Pressable>
          <Card containerStyle={{ marginTop: 15 }}>
              <Card.Title>{motTraduit(langIndex, 14)}</Card.Title>
              <Card.Divider />
              <FontAwesomeIcon icon={faTrophy} />
          </Card>
        </Pressable>
        <Pressable>
          <Card containerStyle={{ marginTop: 15 }}>
              <Card.Title>{motTraduit(langIndex, 15)}</Card.Title>
              <Card.Divider />
              <FontAwesomeIcon icon={faUsersViewfinder} />
          </Card>
        </Pressable>
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
  cardStyle: {
    width: '80%',
  },
  footer: {
    marginTop: 20,
    fontSize: 16,
    color: '#888',
  },
});

AppRegistry.registerComponent('KILLSPY', () => element);