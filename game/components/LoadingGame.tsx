import React, { useEffect, useState } from 'react';
import { StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { Text, View } from '@/components/Themed';
import { motTraduit } from './translationHelper';
import { useLanguageStore } from '@/store/languageStore';
import { router, useRouter } from 'expo-router';
import socket from '@/services/socket';

interface LoadingGameProps {
  gameMode: string;
  onGameFound: () => void;
}

interface GameFoundData {
    opponentId: string; // Define the type for opponentId
}

const dotAnimation = ['.', '..', '...'];

export default function LoadingGame({ gameMode, onGameFound }: LoadingGameProps) {
    const { langIndex } = useLanguageStore();
    const router = useRouter();
    const [dotIndex, setDotIndex] = useState(0);
    const [isGameFound, setIsGameFound] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setDotIndex((prevIndex) => (prevIndex + 1) % dotAnimation.length);
        }, 500);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (gameMode === motTraduit(langIndex, 12) && !isGameFound) { // VS Ordinateur
            const timeout = setTimeout(() => {
                setIsGameFound(true);
                onGameFound();
                router.push('/play/bot');
            }, 3000);
            return () => clearTimeout(timeout);
        }
    }, [gameMode, langIndex, onGameFound]);

    useEffect(() => {
        socket.on('gameFound', (data: GameFoundData) => {
            const { opponentId } = data;
            console.log('Jeu trouvé avec l\'opposant:', opponentId);
            setIsGameFound(true);
            onGameFound();
            router.push('/play/partieRapide');
        });

        return () => {
            socket.off('gameFound');
        };
    }, []);

    const handleCancelSearch = () => {
        socket.emit('cancelSearch');
        router.back();
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{gameMode}</Text>
            <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
            <Text style={styles.loadingText}>
                {isGameFound ? motTraduit(langIndex, 34) : motTraduit(langIndex, 33) + dotAnimation[dotIndex]}
            </Text>
            {!isGameFound && (
                <Pressable onPress={handleCancelSearch}>
                    <Text style={styles.backButton}>{motTraduit(langIndex, 35)}</Text>
                </Pressable>
            )}
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
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    loader: {
        marginVertical: 20,
    },
    loadingText: {
        fontSize: 16,
    },
    backButton: {
        fontSize: 16,
        color: '#007AFF',
        marginTop: 20,
    },
});