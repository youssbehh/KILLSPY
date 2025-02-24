/*
import React, { useState, useEffect } from 'react';
import { StyleSheet, Pressable, View } from 'react-native';
import { Text } from '@/components/Themed';
import { motTraduit } from '@/components/translationHelper';
import { useLanguageStore } from '@/store/languageStore';
import io from 'socket.io-client';

const socket = io('http://localhost:3000'); // Remplacez par l'URL de votre serveur Socket.IO

export default function PartieRapideGameScreen() {
    const { langIndex } = useLanguageStore();
    const [playerAction, setPlayerAction] = useState<string | null>(null);
    const [opponentAction, setOpponentAction] = useState<string | null>(null);
    const [playerLives, setPlayerLives] = useState(3);
    const [opponentLives, setOpponentLives] = useState(3);
    const [isGameStarted, setIsGameStarted] = useState(false);
    const [actionCountdown, setActionCountdown] = useState(5);
    const [afkCount, setAfkCount] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [isWinner, setIsWinner] = useState<boolean | null>(null);

    useEffect(() => {
        socket.on('connect', () => {
            console.log('Socket.IO connection established');
            setIsGameStarted(true);
        });

        socket.on('opponentAction', (action: string) => {
            setOpponentAction(action);
            setAfkCount(0); // Réinitialiser le compteur AFK
        });

        socket.on('gameOver', (winner: boolean) => {
            setGameOver(true);
            setIsWinner(winner);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    useEffect(() => {
        if (isGameStarted && actionCountdown > 0) {
            const timer = setTimeout(() => {
                setActionCountdown(actionCountdown - 1);
                if (actionCountdown === 1) {
                    // Si le joueur n'a pas joué, incrémenter le compteur AFK
                    if (!playerAction) {
                        setAfkCount(prev => prev + 1);
                    }
                }
            }, 1000);
            return () => clearTimeout(timer);
        } else if (actionCountdown === 0) {
            // Vérifier si le joueur est AFK
            if (afkCount >= 5) {
                // Déclarer l'autre joueur vainqueur
                socket.emit('winner', 'opponent');
                setGameOver(true);
                setIsWinner(false);
            } else {
                // Réinitialiser pour le prochain tour
                setActionCountdown(5);
                setPlayerAction(null);
                setOpponentAction(null);
            }
        }
    }, [isGameStarted, actionCountdown, playerAction, afkCount]);

    const handleAction = (action: string) => {
        setPlayerAction(action);
        socket.emit('playerAction', action); // Envoyer l'action au serveur
    };

    return (
        <View style={styles.container}>
            {gameOver ? (
                <Text style={styles.gameOverText}>
                    {isWinner === null ? 'Match nul' : isWinner ? 'Vous avez gagné!' : 'Vous avez perdu!'}
                </Text>
            ) : (
                <>
                    <Text>Vos vies: {playerLives} | Action: {playerAction || '...'}</Text>
                    <Text>Vies Opposant: {opponentLives} | Action Opposant: {opponentAction || '...'}</Text>
                    <Text>Temps restant: {actionCountdown}</Text>
                    <View style={styles.buttonsContainer}>
                        <Pressable style={styles.button} onPress={() => handleAction(motTraduit(langIndex, 42))}>
                            <Text>{motTraduit(langIndex, 42)}</Text>
                        </Pressable>
                        <Pressable style={styles.button} onPress={() => handleAction(motTraduit(langIndex, 41))}>
                            <Text>{motTraduit(langIndex, 41)}</Text>
                        </Pressable>
                        <Pressable style={styles.button} onPress={() => handleAction(motTraduit(langIndex, 40))}>
                            <Text>{motTraduit(langIndex, 40)}</Text>
                        </Pressable>
                    </View>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    gameOverText: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 30,
        textAlign: 'center',
        color: '#000',
    },
    buttonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        padding: 20,
    },
    button: {
        padding: 15,
        backgroundColor: '#007AFF',
        borderRadius: 10,
        minWidth: 100,
        alignItems: 'center',
    },
});
*/