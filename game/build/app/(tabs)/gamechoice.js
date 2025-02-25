var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React, { useEffect, useState } from 'react';
import { AppRegistry, ScrollView } from 'react-native';
import { Pressable, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { motTraduit } from '@/components/translationHelper';
import { Text, View } from '@/components/Themed';
import { Card } from '@rneui/themed';
import { appVersion } from '../../config';
import { useLanguageStore } from '../../store/languageStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
//import socket from '@/services/socket';
import { FontAwesomeWrapper } from '@/components/FontAwesomeWrapper';
import { faRobot, faBolt, faTrophy, faUsersViewfinder } from '@fortawesome/free-solid-svg-icons';
const element = () => (<View>
    <FontAwesomeWrapper icon={faRobot}/>
    <FontAwesomeWrapper icon={faBolt}/>
    <FontAwesomeWrapper icon={faTrophy}/>
    <FontAwesomeWrapper icon={faUsersViewfinder}/>
  </View>);
export default function GameChoiceScreen() {
    const { langIndex } = useLanguageStore();
    const router = useRouter();
    const [username, setUsername] = useState('');
    const handleGameChoice = (modeId) => {
        //socket.emit('joinGame');
        router.push({
            pathname: '../loading',
            params: { mode: motTraduit(langIndex, modeId) }
        });
    };
    useEffect(() => {
        const getUsername = () => __awaiter(this, void 0, void 0, function* () {
            const storedUsername = yield AsyncStorage.getItem('username');
            setUsername(storedUsername || '');
        });
        getUsername();
    }, []);
    return (<>
    <Stack.Screen options={{
            title: motTraduit(langIndex, 3),
            headerBackTitle: ' ',
            headerBackVisible: false,
            gestureEnabled: false,
        }}/>
    <View style={styles.container}>
      <Text style={styles.titleh1}>KILLSPY</Text>
      <Text style={styles.titleh2}>{motTraduit(langIndex, 11)} <Text style={styles.boldText}>{username}</Text></Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)"/>
      <ScrollView style={styles.cardStyle}>
        <Pressable onPress={() => handleGameChoice(12)}>
          <Card containerStyle={{ marginTop: 15 }}>
              <Card.Title>{motTraduit(langIndex, 12)}</Card.Title>
              <Card.Divider />
              <View style={styles.iconContainer}>
                  <FontAwesomeWrapper icon={faRobot} size="2x"/>
              </View>
          </Card>
        </Pressable>
        <Pressable onPress={() => handleGameChoice(13)}>
          <Card containerStyle={{ marginTop: 15 }}>
              <Card.Title>{motTraduit(langIndex, 13)}</Card.Title>
              <Card.Divider />
              <View style={styles.iconContainer}>
                  <FontAwesomeWrapper icon={faBolt} size="2x"/>
              </View>
          </Card>
        </Pressable>
        <Pressable onPress={() => handleGameChoice(14)}>
          <Card containerStyle={{ marginTop: 15 }}>
              <Card.Title>{motTraduit(langIndex, 14)}</Card.Title>
              <Card.Divider />
              <View style={styles.iconContainer}>
                  <FontAwesomeWrapper icon={faTrophy} size="2x"/>
              </View>
          </Card>
        </Pressable>
        <Pressable onPress={() => handleGameChoice(15)}>
          <Card containerStyle={{ marginTop: 15 }}>
              <Card.Title>{motTraduit(langIndex, 15)}</Card.Title>
              <Card.Divider />
              <View style={styles.iconContainer}>
                  <FontAwesomeWrapper icon={faUsersViewfinder} size="2x"/>
              </View>
          </Card>
        </Pressable>
      </ScrollView>
      <Text style={styles.footer}>MIMIR Studio 2024 / V. {appVersion}</Text>
    </View>
    </>);
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
        marginBottom: 5,
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
    },
});
AppRegistry.registerComponent('KILLSPY', () => element);
