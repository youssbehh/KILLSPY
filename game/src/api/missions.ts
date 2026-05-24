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

export const claimDailyMission = async (id: number): Promise<{ xpEarned: number }> => {
  const { data } = await apiClient.post<{ xpEarned: number }>(`/missions/daily/${id}/claim`);
  return data;
};
