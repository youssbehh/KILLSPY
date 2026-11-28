-- CreateTable
CREATE TABLE "LiveMatch" (
    "id" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "players" JSONB NOT NULL,
    "state" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiveMatch_pkey" PRIMARY KEY ("id")
);
