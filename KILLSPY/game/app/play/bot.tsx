import React, { useState, useEffect } from 'react';
import { StyleSheet, Pressable, View } from 'react-native';
import { Text } from '@/components/Themed';
import { motTraduit } from '@/components/translationHelper';
import { useLanguageStore } from '@/store/languageStore';
import { router } from 'expo-router';

type Action = 'recharger' | 'tirer' | 'bouclier' | null;

export default function GameScreen() {
    const { langIndex } = useLanguageStore();
    const [countdown, setCountdown] = useState(3);
    const [isGameStarted, setIsGameStarted] = useState(false);
    const [actionCountdown, setActionCountdown] = useState(5);
    const [playerAction, setPlayerAction] = useState<Action>(null);
    const [botAction, setBotAction] = useState<Action>(null);
    const [playerMunitions, setPlayerMunitions] = useState(0);
    const [botMunitions, setBotMunitions] = useState(0);
    const [playerLives, setPlayerLives] = useState(3);
    const [botLives, setBotLives] = useState(3);
    const [gameOver, setGameOver] = useState(false);
    const [isWinner, setIsWinner] = useState(false);

    // Décompte initial de 3 secondes
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else {
            setIsGameStarted(true);
        }
    }, [countdown]);

    // Fonction pour obtenir une action aléatoire
    const getRandomAction = (): Action => {
        const actions: Action[] = ['recharger', 'tirer', 'bouclier'];
        if (playerMunitions === 0) return 'recharger';
        if (playerMunitions === 3) return actions[1 + Math.floor(Math.random() * 2)];
        return actions[Math.floor(Math.random() * 3)];
    };

    // Décompte de 5 secondes pour l'action
    useEffect(() => {
        if (isGameStarted && actionCountdown > 0) {
            const timer = setTimeout(() => {
                setActionCountdown(actionCountdown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (isGameStarted && actionCountdown === 0) {
            // Si aucune action n'est choisie, en choisir une au hasard
            if (!playerAction) {
                const randomAction = getRandomAction();
                setPlayerAction(randomAction);
            }
            // Exécuter l'action du bot et les actions après un court délai
            setTimeout(() => {
                executeBotAction();
                setTimeout(() => {
                    executeActions();
                }, 100);
            }, 100);
        }
    }, [isGameStarted, actionCountdown]);

    const executeBotAction = () => {
        // Logique simple du bot
        let action: Action;
        if (botMunitions === 0) {
            action = 'recharger';
        } else if (botMunitions === 3) {
            action = Math.random() > 0.5 ? 'tirer' : 'bouclier';
        } else {
            const random = Math.random();
            if (random < 0.33) action = 'recharger';
            else if (random < 0.66) action = 'tirer';
            else action = 'bouclier';
        }
        setBotAction(action);
    };

    // Ajout d'un useEffect pour surveiller les changements d'actions
    useEffect(() => {
        if (actionCountdown === 0 && playerAction && botAction) {
            executeActions();
        }
    }, [playerAction, botAction]);

    const executeActions = () => {
        // Exécution des actions
        const currentPlayerAction = playerAction;
        const currentBotAction = botAction;

        if (currentPlayerAction === 'recharger') {
            setPlayerMunitions(prev => Math.min(prev + 1, 3));
        }
        if (currentBotAction === 'recharger') {
            setBotMunitions(prev => Math.min(prev + 1, 3));
        }

        // Gestion des tirs
        if (currentPlayerAction === 'tirer' && playerMunitions > 0 && currentBotAction !== 'bouclier') {
            setBotLives(prev => {
                const newLives = prev - 1;
                if (newLives <= 0) {
                    setGameOver(true);
                    setIsWinner(true);
                }
                return newLives;
            });
            setPlayerMunitions(prev => prev - 1);
        }
        if (currentBotAction === 'tirer' && botMunitions > 0 && currentPlayerAction !== 'bouclier') {
            setPlayerLives(prev => {
                const newLives = prev - 1;
                if (newLives <= 0) {
                    setGameOver(true);
                    setIsWinner(false);
                }
                return newLives;
            });
            setBotMunitions(prev => prev - 1);
        }

        // Réinitialisation pour le prochain tour
        setTimeout(() => {
            setPlayerAction(null);
            setBotAction(null);
            setActionCountdown(5);
        }, 2000);
    };

    return (
        <View style={styles.container}>
            {gameOver ? (
                <View style={styles.gameOverContainer}>
                    <Text style={styles.gameOverText}>
                        {isWinner ? motTraduit(langIndex, 36) : motTraduit(langIndex, 37)}
                    </Text>
                    <Pressable 
                        style={styles.restartButton}
                        onPress={() => router.push('/(tabs)')}
                    >
                        <Text style={styles.buttonText}>{motTraduit(langIndex, 39)}</Text>
                    </Pressable>
                </View>
            ) : !isGameStarted ? (
                <Text style={styles.countdown}>{countdown}</Text>
            ) : (
                <>
                    <View style={styles.statsContainer}>
                        <Text style={styles.statsText}>Vies Bot: {botLives} | Munitions: {botMunitions}</Text>
                        <Text style={styles.statsText}>Action Bot: {botAction || '...'}</Text>
                    </View>

                    <Text style={styles.countdown}>{actionCountdown}</Text>

                    <View style={styles.statsContainer}>
                        <Text style={styles.statsText}>Vos vies: {playerLives} | Munitions: {playerMunitions}</Text>
                        <Text style={styles.statsText}>Votre action: {playerAction || '...'}</Text>
                    </View>

                    <View style={styles.buttonsContainer}>
                        <Pressable 
                            style={[styles.button, playerAction === 'recharger' && styles.selectedButton]} 
                            onPress={() => setPlayerAction('recharger')}
                            disabled={actionCountdown === 0 || playerMunitions === 3}
                        >
                            <Text style={styles.buttonText}>Recharger</Text>
                        </Pressable>
                        <Pressable 
                            style={[styles.button, playerAction === 'tirer' && styles.selectedButton]} 
                            onPress={() => setPlayerAction('tirer')}
                            disabled={actionCountdown === 0 || playerMunitions === 0}
                        >
                            <Text style={styles.buttonText}>Tirer</Text>
                        </Pressable>
                        <Pressable 
                            style={[styles.button, playerAction === 'bouclier' && styles.selectedButton]} 
                            onPress={() => setPlayerAction('bouclier')}
                            disabled={actionCountdown === 0}
                        >
                            <Text style={styles.buttonText}>Bouclier</Text>
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
    countdown: {
        fontSize: 48,
        fontWeight: 'bold',
        marginVertical: 20,
        color: '#000',
    },
    statsContainer: {
        alignItems: 'center',
        marginVertical: 20,
    },
    statsText: {
        color: '#000',
        fontSize: 16,
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
    selectedButton: {
        backgroundColor: '#004999',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    gameOverContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    gameOverText: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 30,
        textAlign: 'center',
        color: '#000',
    },
    restartButton: {
        padding: 15,
        backgroundColor: '#007AFF',
        borderRadius: 10,
        minWidth: 150,
        alignItems: 'center',
    },
});