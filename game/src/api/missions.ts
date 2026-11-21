import { apiClient } from './client';

export interface DailyMission {
  id: number;
  slug: string;
  title: string;
  metric: string;
  target: number;
  xpReward: number;
  current: number;
  completed: boolean;
  rewarded: boolean;
  resetAt: string;
}

export const getDailyMissions = async (): Promise<DailyMission[]> => {
  const { data } = await apiClient.get<{ missions: DailyMission[] }>('/missions/daily');
  return data.missions;
};

export interface ClaimResult {
  xpEarned: number;
  /** New XP total and level of the player. */
  xp: number;
  level: number;
}

export const claimDailyMission = async (id: number): Promise<ClaimResult> => {
  const { data } = await apiClient.post<ClaimResult>(`/missions/daily/${id}/claim`);
  return data;
};
