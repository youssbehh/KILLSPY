import React, { useCallback, useEffect, useState } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useGameStore } from '@/src/stores/gameStore';
import { useAuthStore } from '@/src/stores/authStore';
import { useMatchmaking } from '@/src/sockets/useMatchmaking';
import { PvpMode } from '@/src/sockets/events';
import { GameAction, isActionLegal } from '@/src/game/gameEngine';
import { MatchmakingScreen } from '@/src/screens/MatchmakingScreen';
import { HUDScreen } from '@/src/screens/HUDScreen';
import { EndMatchScreen } from '@/src/screens/EndMatchScreen';
import { MOTION } from '@/src/theme/motion';

const HOME = '/(tabs)/gamechoice';

export default function PartieRapideScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ mode?: string }>();
  const mode: PvpMode = params.mode === 'ranked' ? 'pvp_ranked' : 'pvp_quick';

  const { joinQueue, sendAction, leaveGame } = useMatchmaking();

  const matchStatus = useGameStore((s) => s.matchStatus);
  const outcome = useGameStore((s) => s.outcome);
  const rewards = useGameStore((s) => s.rewards);
  const finalState = useGameStore((s) => s.state);
  const matchMode = useGameStore((s) => s.mode);

  // Enter the queue when the screen opens; leave queue / forfeit when it closes.
  useEffect(() => {
    joinQueue(mode);
    return () => leaveGame();
  }, [mode, joinQueue, leaveGame]);

  // Once the server has settled the match, apply the rewards locally and refresh server data.
  useEffect(() => {
    if (matchStatus !== 'finished' || !rewards) return;
    const { user, updateUser } = useAuthStore.getState();
    if (user && (rewards.moneyDelta !== 0 || rewards.mmrDelta !== 0)) {
      updateUser({
        money: user.money + rewards.moneyDelta,
        mmr: Math.max(0, user.mmr + rewards.mmrDelta),
      });
    }
    queryClient.invalidateQueries({ queryKey: ['games'] });
    queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    queryClient.invalidateQueries({ queryKey: ['missions'] });
    queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
  }, [matchStatus, rewards, queryClient]);

  const handleQuit = useCallback(() => {
    leaveGame();
    router.replace(HOME);
  }, [leaveGame, router]);

  const handleRematch = useCallback(() => {
    joinQueue(matchMode);
  }, [joinQueue, matchMode]);

  const handleAction = useCallback(
    (action: GameAction) => {
      const { state, selectedAction, matchStatus: status, setSelectedAction } = useGameStore.getState();
      // The server keeps the first action of a turn: lock locally as soon as it is sent.
      if (status !== 'playing' || selectedAction) return;
      if (!isActionLegal(state.player, action)) return;
      setSelectedAction(action);
      sendAction(action);
    },
    [sendAction],
  );

  // The server announces the end with the last turn: hold the duel screen long
  // enough for the killing shot to be seen, then show the debrief.
  const [debriefReady, setDebriefReady] = useState(false);
  const lastTurnPlayed = finalState.round > 0 && outcome !== 'opponent_forfeit';
  useEffect(() => {
    if (matchStatus !== 'finished') return setDebriefReady(false);
    if (!lastTurnPlayed) return setDebriefReady(true);
    const timer = setTimeout(() => setDebriefReady(true), MOTION.reveal);
    return () => clearTimeout(timer);
  }, [matchStatus, lastTurnPlayed]);

  const isFinished = matchStatus === 'finished' && debriefReady;
  const isPlaying =
    matchStatus === 'playing' || matchStatus === 'resolving' || (matchStatus === 'finished' && !debriefReady);

  return (
    <>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />

      {!isPlaying && !isFinished && <MatchmakingScreen onAbort={handleQuit} />}

      {isPlaying && <HUDScreen onAction={handleAction} onQuit={handleQuit} />}

      {isFinished && (
        <EndMatchScreen
          outcome={outcome ?? 'lost'}
          mode={matchMode}
          rewards={rewards}
          rounds={finalState.round}
          livesLeft={finalState.player.lives}
          onRematch={handleRematch}
          onHome={handleQuit}
        />
      )}
    </>
  );
}
