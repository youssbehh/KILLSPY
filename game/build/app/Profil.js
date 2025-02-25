import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { motTraduit } from '@/components/translationHelper';
import ProfilmmrScreen from './sousfriends/profilmmr';
import PrflHistoricScreen from './sousprofile/prflhistoric';
import PrflInfoScreen from './sousprofile/prflinfo';
import { Text, View } from '@/components/Themed';
import { useLanguageStore } from '../store/languageStore';
export default function ProfilScreen() {
    const { langIndex } = useLanguageStore();
    return (<View style={styles.container}>
      <Text style={styles.title}>{motTraduit(langIndex, 6)}</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)"/>
      <ScrollView>
      <View style={styles.componantcontainer}>
          <View style={styles.profilmmrcontainer}>
            <PrflInfoScreen />
          </View>
          <View style={styles.profilmmrcontainer}>
            <ProfilmmrScreen />
          </View>
          <View style={styles.profilmmrcontainer}>
            <PrflHistoricScreen />
          </View>
        </View>
      </ScrollView>
    </View>);
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginTop: 10,
    },
    separator: {
        marginVertical: 30,
        height: 1,
        width: '80%',
    },
    componantcontainer: {
        flexWrap: 'wrap',
        flexDirection: 'row',
        justifyContent: 'center',
        width: '100%'
    },
    profilmmrcontainer: {
        padding: 10,
        margin: 10,
        width: '40%'
    },
});
