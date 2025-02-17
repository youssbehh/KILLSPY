/*
  Warnings:

  - You are about to drop the `Gamerule` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Gamerule" DROP CONSTRAINT "Gamerule_ID_User_fkey";

-- DropTable
DROP TABLE "Gamerule";

-- CreateTable
CREATE TABLE "Friends" (
    "ID_Friend" SERIAL NOT NULL,
    "Connected" BOOLEAN NOT NULL,
    "Blocked" BOOLEAN NOT NULL,
    "ID_User" INTEGER NOT NULL,

    CONSTRAINT "Friends_pkey" PRIMARY KEY ("ID_Friend")
);

-- AddForeignKey
ALTER TABLE "Friends" ADD CONSTRAINT "Friends_ID_User_fkey" FOREIGN KEY ("ID_User") REFERENCES "Users"("ID_User") ON DELETE RESTRICT ON UPDATE CASCADE;
