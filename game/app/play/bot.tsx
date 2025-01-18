import React, { useState, useEffect } from 'react';
import { StyleSheet, Pressable, View } from 'react-native';
import { Text } from '@/components/Themed';
import { motTraduit } from '@/components/translationHelper';
import { useLanguageStore } from '@/store/languageStore';
import { router, Stack } from 'expo-router';
import QuitButton from '@/components/QuitButton';

type Action = string | null;

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
    const [showingResult, setShowingResult] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [isWinner, setIsWinner] = useState<boolean | null>(false);

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
        const actions: Action[] = [motTraduit(langIndex, 42), motTraduit(langIndex, 41), motTraduit(langIndex, 40)];
        if (playerMunitions === 0) return motTraduit(langIndex, 42);
        if (playerMunitions === 3) return actions[1 + Math.floor(Math.random() * 2)];
        return actions[Math.floor(Math.random() * 3)];
    };

    // Décompte de 5 secondes pour l'action
    useEffect(() => {
        if (gameOver) return; // Arrêter si game over

        if (isGameStarted && actionCountdown > 0) {
            const timer = setTimeout(() => {
                setActionCountdown(actionCountdown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (isGameStarted && actionCountdown === 0) {
            // Exécuter l'action aléatoire UNIQUEMENT si le joueur n'a pas joué
            if (!playerAction) {
                const randomAction = getRandomAction();
                setPlayerAction(randomAction);
            }
            // Exécuter l'action du bot
            executeBotAction();
        }
    }, [isGameStarted, actionCountdown, gameOver]);

    // Ajout d'un useEffect pour surveiller les changements d'actions
    useEffect(() => {
        if (actionCountdown === 0 && playerAction && botAction) {
            executeActions();
        }
    }, [playerAction, botAction]);

    const executeBotAction = () => {
        // Logique simple du bot
        let action: Action;
        const random = Math.random(); // Un seul nombre aléatoire

        if (botMunitions === 0) {
            action = motTraduit(langIndex, 42); // Forcé de recharger
        } else if (botMunitions === 3) {
            action = random > 0.5 ? motTraduit(langIndex, 41) : motTraduit(langIndex, 40); // Tirer ou bouclier
        } else {
            if (random < 0.33) action = motTraduit(langIndex, 42);      // 33% recharger
            else if (random < 0.66) action = motTraduit(langIndex, 41); // 33% tirer
            else action = motTraduit(langIndex, 40);                    // 33% bouclier
        }
        setBotAction(action);
    };

    const executeActions = () => {
        const currentPlayerAction = playerAction;
        const currentBotAction = botAction;

        // Match nul si les deux tirent en même temps
        if (currentPlayerAction === motTraduit(langIndex, 41) && 
            currentBotAction === motTraduit(langIndex, 41) && 
            playerLives === 1 && 
            botLives === 1) {
            setPlayerLives(prev => prev - 1);
            setBotLives(prev => prev - 1);
            setShowingResult(true);
            setTimeout(() => {
                setGameOver(true);
                setIsWinner(null); // null pour match nul
            }, 3000);
            setPlayerMunitions(prev => prev - 1);
            setBotMunitions(prev => prev - 1);
            return; // Arrêter l'exécution ici
        }

        // Recharge
        if (currentPlayerAction === motTraduit(langIndex, 42)) {
            setPlayerMunitions(prev => Math.min(prev + 1, 3));
        }
        if (currentBotAction === motTraduit(langIndex, 42)) {
            setBotMunitions(prev => Math.min(prev + 1, 3));
        }

        // Tirs du joueur
        if (currentPlayerAction === motTraduit(langIndex, 41) && playerMunitions > 0) {
            setPlayerMunitions(prev => prev - 1); // Déduire la munition dans tous les cas
            if (currentBotAction !== motTraduit(langIndex, 40)) { // Vérifier si le tir touche
                setBotLives(prev => {
                    const newLives = prev - 1;
                    if (newLives <= 0) {
                        setShowingResult(true);
                        setTimeout(() => {
                            setGameOver(true);
                            setIsWinner(true);
                        }, 3000);
                    }
                    return newLives;
                });
            }
        }

        // Tirs du bot
        if (currentBotAction === motTraduit(langIndex, 41) && botMunitions > 0) {
            setBotMunitions(prev => prev - 1); // Déduire la munition dans tous les cas
            if (currentPlayerAction !== motTraduit(langIndex, 40)) { // Vérifier si le tir touche
                setPlayerLives(prev => {
                    const newLives = prev - 1;
                    if (newLives <= 0) {
                        setShowingResult(true);
                        setTimeout(() => {
                            setGameOver(true);
                            setIsWinner(false);
                        }, 3000);
                    }
                    return newLives;
                });
            }
        }

        // Réinitialisation pour le prochain tour
        setTimeout(() => {
            setPlayerAction(null);
            setBotAction(null);
            setActionCountdown(5);
        }, 2000);
    };

    return (
        <>
        <Stack.Screen 
        options={{
          title: '',
          /*headerRight: () => <QuitButton />,*/
          headerBackTitle: ' ', 
          headerBackVisible: false,
          gestureEnabled: false,
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerShadowVisible: false,
        }} 
      />
        <View style={styles.container}>
            {gameOver ? (
                <View style={styles.gameOverContainer}>
                    <Text style={styles.gameOverText}>
                        {isWinner === null ? motTraduit(langIndex, 32) : // Match nul
                         isWinner ? motTraduit(langIndex, 36) : motTraduit(langIndex, 37)}
                    </Text>
                    <View style={styles.buttonsRow}>
                        <Pressable 
                            style={styles.restartButton}
                            onPress={() => router.push('/play/bot')}
                        >
                            <Text style={styles.buttonText}>{motTraduit(langIndex, 38)}</Text>
                        </Pressable>
                        <Pressable 
                            style={styles.restartButton}
                            onPress={() => router.replace('/(tabs)/gamechoice')}
                        >
                            <Text style={styles.buttonText}>{motTraduit(langIndex, 43)}</Text>
                        </Pressable>
                    </View>
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
                            style={[styles.button, playerAction === motTraduit(langIndex, 42) && styles.selectedButton]} 
                            onPress={() => setPlayerAction(motTraduit(langIndex, 42))}
                            disabled={actionCountdown === 0 || playerMunitions === 3}
                        >
                            <Text style={styles.buttonText}>{motTraduit(langIndex, 42)}</Text>
                        </Pressable>
                        <Pressable 
                            style={[styles.button, playerAction === motTraduit(langIndex, 41) && styles.selectedButton]} 
                            onPress={() => setPlayerAction(motTraduit(langIndex, 41))}
                            disabled={actionCountdown === 0 || playerMunitions === 0}
                        >
                            <Text style={styles.buttonText}>{motTraduit(langIndex, 41)}</Text>
                        </Pressable>
                        <Pressable 
                            style={[styles.button, playerAction === motTraduit(langIndex, 40) && styles.selectedButton]} 
                            onPress={() => setPlayerAction(motTraduit(langIndex, 40))}
                            disabled={actionCountdown === 0}
                        >
                            <Text style={styles.buttonText}>{motTraduit(langIndex, 40)}</Text>
                        </Pressable>
                    </View>
                </>
            )}
        </View>
        </>
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
    buttonsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 20,
    },
    restartButton: {
        padding: 15,
        backgroundColor: '#007AFF',
        borderRadius: 10,
        minWidth: 150,
        alignItems: 'center',
    },
});