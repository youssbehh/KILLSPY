import React from 'react';
import { StyleSheet, Pressable, Alert } from 'react-native';
import { Text } from '@/components/Themed';
import { router } from 'expo-router';
import { motTraduit } from '@/components/translationHelper';
import { useLanguageStore } from '@/store/languageStore';

interface QuitButtonProps {
    redirectPath?: any;
}

export default function QuitButton({ redirectPath = '/(tabs)' }: QuitButtonProps) {
    const { langIndex } = useLanguageStore();

    const handleQuit = () => {
        Alert.alert(
            motTraduit(langIndex, 44), // "Quitter la partie ?"
            motTraduit(langIndex, 45), // "Êtes-vous sûr de vouloir quitter ?"
            [
                {
                    text: motTraduit(langIndex, 35), // "Annuler"
                    style: 'cancel',
                },
                {
                    text: motTraduit(langIndex, 39), // "Quitter"
                    style: 'destructive',
                    onPress: () => router.replace(redirectPath),
                },
            ],
            { cancelable: true }
        );
    };

    return (
        <Pressable 
            onPress={handleQuit}
            style={({ pressed }) => [
                styles.quitButton,
                pressed && styles.quitButtonPressed
            ]}
        >
            <Text style={styles.quitButtonText}>✕</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    quitButton: {
        padding: 10,
        marginRight: 10,
    },
    quitButtonPressed: {
        opacity: 0.7,
    },
    quitButtonText: {
        fontSize: 20,
        color: '#FF3B30',
        fontWeight: 'bold',
    },
});
