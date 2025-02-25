import React from 'react';
import { StyleSheet } from 'react-native';
import { motTraduit } from '@/components/translationHelper';
import EditScreenInfo from '@/components/EditScreenInfo';
import { Text, View } from '@/components/Themed';
import { useLanguageStore } from '../../store/languageStore';
export default function InventoryScreen() {
    const { langIndex } = useLanguageStore();
    return (<View style={styles.container}>
      <Text style={styles.title}>{motTraduit(langIndex, 8)}</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)"/>
      <EditScreenInfo path="app/(tabs)/two.tsx"/>
    </View>);
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
