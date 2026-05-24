-- CreateEnum
CREATE TYPE "MissionMetric" AS ENUM ('wins', 'rounds_played', 'ranked_wins', 'ranked_played');

-- AlterEnum
ALTER TYPE "CosmeticType" ADD VALUE 'ui_theme';

-- CreateTable
CREATE TABLE "MissionTemplate" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "metric" "MissionMetric" NOT NULL,
    "target" INTEGER NOT NULL,
    "xpReward" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "MissionTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerMissionAssignment" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "missionId" INTEGER NOT NULL,
    "day" TEXT NOT NULL,
    "rewarded" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PlayerMissionAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MissionTemplate_slug_key" ON "MissionTemplate"("slug");

-- CreateIndex
CREATE INDEX "MissionTemplate_active_idx" ON "MissionTemplate"("active");

-- CreateIndex
CREATE INDEX "PlayerMissionAssignment_userId_day_idx" ON "PlayerMissionAssignment"("userId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerMissionAssignment_userId_missionId_day_key" ON "PlayerMissionAssignment"("userId", "missionId", "day");

-- AddForeignKey
ALTER TABLE "PlayerMissionAssignment" ADD CONSTRAINT "PlayerMissionAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("ID_User") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerMissionAssignment" ADD CONSTRAINT "PlayerMissionAssignment_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "MissionTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
