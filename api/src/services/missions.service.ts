import { MissionMetric, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MISSIONS_PER_DAY = 4;

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function dayBoundsUTC(day: string): { start: Date; end: Date } {
  const start = new Date(`${day}T00:00:00.000Z`);
  const end = new Date(`${day}T23:59:59.999Z`);
  return { start, end };
}

async function computeProgress(
  userId: number,
  metric: MissionMetric,
  start: Date,
  end: Date,
): Promise<number> {
  switch (metric) {
    case 'wins':
      return prisma.gameHistory.count({
        where: { ID_User: userId, V_D: true, DateGame: { gte: start, lte: end } },
      });
    case 'rounds_played':
      return prisma.gameHistory.count({
        where: { ID_User: userId, DateGame: { gte: start, lte: end } },
      });
    case 'ranked_wins':
      return prisma.gameHistory.count({
        where: { ID_User: userId, V_D: true, Mode: 'pvp_ranked', DateGame: { gte: start, lte: end } },
      });
    case 'ranked_played':
      return prisma.gameHistory.count({
        where: { ID_User: userId, Mode: 'pvp_ranked', DateGame: { gte: start, lte: end } },
      });
    default:
      return 0;
  }
}

export interface DailyMissionDTO {
  id: number;
  slug: string;
  title: string;
  metric: MissionMetric;
  target: number;
  xpReward: number;
  current: number;
  completed: boolean;
  rewarded: boolean;
  resetAt: string;
}

export async function getDailyMissions(userId: number): Promise<DailyMissionDTO[]> {
  const day = todayUTC();
  const { start, end } = dayBoundsUTC(day);

  // Fetch or lazily create today's assignments
  let assignments = await prisma.playerMissionAssignment.findMany({
    where: { userId, day },
    include: { mission: true },
  });

  if (assignments.length < MISSIONS_PER_DAY) {
    // Pick random active templates not yet assigned today
    const assignedIds = assignments.map((a) => a.missionId);
    const pool = await prisma.missionTemplate.findMany({
      where: { active: true, id: { notIn: assignedIds } },
    });

    const needed = MISSIONS_PER_DAY - assignments.length;
    const picks = pool.sort(() => Math.random() - 0.5).slice(0, needed);

    if (picks.length > 0) {
      await prisma.playerMissionAssignment.createMany({
        data: picks.map((t) => ({ userId, missionId: t.id, day })),
        skipDuplicates: true,
      });

      assignments = await prisma.playerMissionAssignment.findMany({
        where: { userId, day },
        include: { mission: true },
      });
    }
  }

  const resetAt = `${day}T23:59:59.000Z`;

  return Promise.all(
    assignments.map(async (a) => {
      const current = a.rewarded
        ? a.mission.target
        : await computeProgress(userId, a.mission.metric, start, end);

      return {
        id: a.id,
        slug: a.mission.slug,
        title: a.mission.title,
        metric: a.mission.metric,
        target: a.mission.target,
        xpReward: a.mission.xpReward,
        current: Math.min(current, a.mission.target),
        completed: current >= a.mission.target,
        rewarded: a.rewarded,
        resetAt,
      };
    }),
  );
}

export async function claimMission(
  userId: number,
  assignmentId: number,
): Promise<{ xpEarned: number }> {
  const assignment = await prisma.playerMissionAssignment.findFirst({
    where: { id: assignmentId, userId, day: todayUTC() },
    include: { mission: true },
  });

  if (!assignment) throw Object.assign(new Error('Mission not found'), { status: 404 });
  if (assignment.rewarded) throw Object.assign(new Error('Already claimed'), { status: 409 });

  const { start, end } = dayBoundsUTC(todayUTC());
  const current = await computeProgress(userId, assignment.mission.metric, start, end);

  if (current < assignment.mission.target) {
    throw Object.assign(new Error('Mission not completed'), { status: 422 });
  }

  await prisma.$transaction([
    prisma.playerMissionAssignment.update({
      where: { id: assignmentId },
      data: { rewarded: true },
    }),
  ]);

  return { xpEarned: assignment.mission.xpReward };
}
