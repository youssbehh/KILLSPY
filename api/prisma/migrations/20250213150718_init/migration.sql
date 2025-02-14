/*
  Warnings:

  - You are about to drop the `Clients` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Loans` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Repayments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Settings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Users` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `azfazf` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Clients" DROP CONSTRAINT "Clients_userId_fkey";

-- DropForeignKey
ALTER TABLE "Loans" DROP CONSTRAINT "Loans_clientId_fkey";

-- DropForeignKey
ALTER TABLE "Loans" DROP CONSTRAINT "Loans_userId_fkey";

-- DropForeignKey
ALTER TABLE "Repayments" DROP CONSTRAINT "Repayments_clientId_fkey";

-- DropForeignKey
ALTER TABLE "Repayments" DROP CONSTRAINT "Repayments_loanId_fkey";

-- DropForeignKey
ALTER TABLE "Settings" DROP CONSTRAINT "Settings_userId_fkey";

-- DropForeignKey
ALTER TABLE "Users" DROP CONSTRAINT "Users_idRole_fkey";

-- DropTable
DROP TABLE "Clients";

-- DropTable
DROP TABLE "Loans";

-- DropTable
DROP TABLE "Repayments";

-- DropTable
DROP TABLE "Settings";

-- DropTable
DROP TABLE "Users";

-- DropTable
DROP TABLE "azfazf";

-- CreateTable
CREATE TABLE "User" (
    "ID_User" SERIAL NOT NULL,
    "Username" TEXT NOT NULL,
    "Email" TEXT NOT NULL,
    "Password" TEXT NOT NULL,
    "MMR" INTEGER NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("ID_User")
);

-- CreateTable
CREATE TABLE "Leaderboard" (
    "ID_Leaderboard" SERIAL NOT NULL,
    "ID_User" INTEGER NOT NULL,

    CONSTRAINT "Leaderboard_pkey" PRIMARY KEY ("ID_Leaderboard")
);

-- CreateTable
CREATE TABLE "Role" (
    "ID_Role" SERIAL NOT NULL,
    "Role" TEXT NOT NULL,
    "ID_User" INTEGER NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("ID_Role")
);

-- CreateTable
CREATE TABLE "Rank" (
    "ID_Rank" SERIAL NOT NULL,
    "RankName" TEXT NOT NULL,
    "MMR_Range" TEXT NOT NULL,

    CONSTRAINT "Rank_pkey" PRIMARY KEY ("ID_Rank")
);

-- CreateTable
CREATE TABLE "PurchaseHistory" (
    "ID_Achat" SERIAL NOT NULL,
    "PurchaseDate" TIMESTAMP(3) NOT NULL,
    "Qty" INTEGER NOT NULL,
    "ID_User" INTEGER NOT NULL,

    CONSTRAINT "PurchaseHistory_pkey" PRIMARY KEY ("ID_Achat")
);

-- CreateTable
CREATE TABLE "Emote" (
    "ID_Emote" SERIAL NOT NULL,
    "EmoteName" TEXT NOT NULL,
    "EmotePicture" TEXT NOT NULL,

    CONSTRAINT "Emote_pkey" PRIMARY KEY ("ID_Emote")
);

-- CreateTable
CREATE TABLE "DailyGift" (
    "ID_Dailygift" SERIAL NOT NULL,
    "ClaimedAt" TIMESTAMP(3) NOT NULL,
    "Gift_Item" TEXT NOT NULL,

    CONSTRAINT "DailyGift_pkey" PRIMARY KEY ("ID_Dailygift")
);

-- CreateTable
CREATE TABLE "ProfilePicture" (
    "ID_PP" SERIAL NOT NULL,
    "PPName" TEXT NOT NULL,
    "PP" TEXT NOT NULL,

    CONSTRAINT "ProfilePicture_pkey" PRIMARY KEY ("ID_PP")
);

-- CreateTable
CREATE TABLE "Card" (
    "ID_THCard" SERIAL NOT NULL,
    "THCardName" TEXT NOT NULL,
    "THCard" TEXT NOT NULL,

    CONSTRAINT "Card_pkey" PRIMARY KEY ("ID_THCard")
);

-- CreateTable
CREATE TABLE "Coupon" (
    "ID_Coupon" SERIAL NOT NULL,
    "Code" TEXT NOT NULL,
    "State" BOOLEAN NOT NULL,
    "Qty" INTEGER NOT NULL,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("ID_Coupon")
);

-- CreateTable
CREATE TABLE "Theme" (
    "ID_ThemeBG" SERIAL NOT NULL,
    "ThemeBGName" TEXT NOT NULL,
    "ThemeBG" TEXT NOT NULL,
    "ID_THCard" INTEGER NOT NULL,
    "ID_PP" INTEGER NOT NULL,

    CONSTRAINT "Theme_pkey" PRIMARY KEY ("ID_ThemeBG")
);

-- CreateTable
CREATE TABLE "Gamerule" (
    "ID_Game" SERIAL NOT NULL,
    "Life" INTEGER NOT NULL,
    "MaxLife" INTEGER NOT NULL,
    "Timer" TIMESTAMP(3) NOT NULL,
    "Bullet" INTEGER NOT NULL,
    "MaxBullet" INTEGER NOT NULL,
    "MuteEmote" BOOLEAN NOT NULL,
    "ID_User" INTEGER NOT NULL,

    CONSTRAINT "Gamerule_pkey" PRIMARY KEY ("ID_Game")
);

-- CreateTable
CREATE TABLE "GameHistory" (
    "ID_GameHistory" SERIAL NOT NULL,
    "V_D" BOOLEAN NOT NULL,
    "DateGame" TIMESTAMP(3) NOT NULL,
    "MMRWin" INTEGER NOT NULL,

    CONSTRAINT "GameHistory_pkey" PRIMARY KEY ("ID_GameHistory")
);

-- CreateTable
CREATE TABLE "Session" (
    "ID_Session" SERIAL NOT NULL,
    "Connected" BOOLEAN NOT NULL,
    "LastConnection" TIMESTAMP(3) NOT NULL,
    "TotalLoginCount" INTEGER NOT NULL,
    "ID_User" INTEGER NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("ID_Session")
);

-- CreateTable
CREATE TABLE "Item" (
    "ID_Item" SERIAL NOT NULL,
    "ItemName" TEXT NOT NULL,
    "ItemPrice" DOUBLE PRECISION NOT NULL,
    "ItemImage" TEXT NOT NULL,
    "ItemOutDate" TIMESTAMP(3) NOT NULL,
    "ItemDisplay" BOOLEAN NOT NULL,
    "Stock" INTEGER NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("ID_Item")
);

-- CreateTable
CREATE TABLE "Shop" (
    "ID_Shop" SERIAL NOT NULL,
    "TimeLeft" TIMESTAMP(3) NOT NULL,
    "ID_ThemeBG" INTEGER,
    "ID_Achat" INTEGER,
    "ID_Emote" INTEGER,
    "ID_Item" INTEGER,

    CONSTRAINT "Shop_pkey" PRIMARY KEY ("ID_Shop")
);

-- CreateTable
CREATE TABLE "Inventory" (
    "ID_Inventory" SERIAL NOT NULL,
    "Money" DOUBLE PRECISION NOT NULL,
    "Qty" INTEGER NOT NULL,
    "ID_ThemeBG" INTEGER,
    "ID_User" INTEGER NOT NULL,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("ID_Inventory")
);

-- CreateTable
CREATE TABLE "Resultat" (
    "ID_User" INTEGER NOT NULL,
    "ID_GameHistory" INTEGER NOT NULL,

    CONSTRAINT "Resultat_pkey" PRIMARY KEY ("ID_User","ID_GameHistory")
);

-- CreateTable
CREATE TABLE "_RankToUser" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_RankToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_Username_key" ON "User"("Username");

-- CreateIndex
CREATE UNIQUE INDEX "User_Email_key" ON "User"("Email");

-- CreateIndex
CREATE UNIQUE INDEX "Leaderboard_ID_User_key" ON "Leaderboard"("ID_User");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_Code_key" ON "Coupon"("Code");

-- CreateIndex
CREATE INDEX "_RankToUser_B_index" ON "_RankToUser"("B");

-- AddForeignKey
ALTER TABLE "Leaderboard" ADD CONSTRAINT "Leaderboard_ID_User_fkey" FOREIGN KEY ("ID_User") REFERENCES "User"("ID_User") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_ID_User_fkey" FOREIGN KEY ("ID_User") REFERENCES "User"("ID_User") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseHistory" ADD CONSTRAINT "PurchaseHistory_ID_User_fkey" FOREIGN KEY ("ID_User") REFERENCES "User"("ID_User") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Theme" ADD CONSTRAINT "Theme_ID_THCard_fkey" FOREIGN KEY ("ID_THCard") REFERENCES "Card"("ID_THCard") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Theme" ADD CONSTRAINT "Theme_ID_PP_fkey" FOREIGN KEY ("ID_PP") REFERENCES "ProfilePicture"("ID_PP") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gamerule" ADD CONSTRAINT "Gamerule_ID_User_fkey" FOREIGN KEY ("ID_User") REFERENCES "User"("ID_User") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_ID_User_fkey" FOREIGN KEY ("ID_User") REFERENCES "User"("ID_User") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shop" ADD CONSTRAINT "Shop_ID_ThemeBG_fkey" FOREIGN KEY ("ID_ThemeBG") REFERENCES "Theme"("ID_ThemeBG") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shop" ADD CONSTRAINT "Shop_ID_Achat_fkey" FOREIGN KEY ("ID_Achat") REFERENCES "PurchaseHistory"("ID_Achat") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shop" ADD CONSTRAINT "Shop_ID_Emote_fkey" FOREIGN KEY ("ID_Emote") REFERENCES "Emote"("ID_Emote") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shop" ADD CONSTRAINT "Shop_ID_Item_fkey" FOREIGN KEY ("ID_Item") REFERENCES "Item"("ID_Item") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_ID_ThemeBG_fkey" FOREIGN KEY ("ID_ThemeBG") REFERENCES "Theme"("ID_ThemeBG") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_ID_User_fkey" FOREIGN KEY ("ID_User") REFERENCES "User"("ID_User") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resultat" ADD CONSTRAINT "Resultat_ID_User_fkey" FOREIGN KEY ("ID_User") REFERENCES "User"("ID_User") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resultat" ADD CONSTRAINT "Resultat_ID_GameHistory_fkey" FOREIGN KEY ("ID_GameHistory") REFERENCES "GameHistory"("ID_GameHistory") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RankToUser" ADD CONSTRAINT "_RankToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Rank"("ID_Rank") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RankToUser" ADD CONSTRAINT "_RankToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("ID_User") ON DELETE CASCADE ON UPDATE CASCADE;
