/*
  Warnings:

  - The primary key for the `Friends` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `Cards` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Coupons` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DailyGift` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Emotes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Inventory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Leaderboard` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProfilePictures` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PurchaseHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Ranks` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Shop` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Themes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_RanksToUsers` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[ID_User,ID_Friend]` on the table `Friends` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "GameModePersisted" AS ENUM ('pvp_quick', 'pvp_ranked');

-- CreateEnum
CREATE TYPE "CosmeticType" AS ENUM ('avatar', 'card_skin', 'emote', 'background', 'shoot_anim', 'shield_anim', 'name_effect');

-- CreateEnum
CREATE TYPE "Rarity" AS ENUM ('common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'secret');

-- DropForeignKey
ALTER TABLE "Inventory" DROP CONSTRAINT "Inventory_ID_ThemeBG_fkey";

-- DropForeignKey
ALTER TABLE "Inventory" DROP CONSTRAINT "Inventory_ID_User_fkey";

-- DropForeignKey
ALTER TABLE "Leaderboard" DROP CONSTRAINT "Leaderboard_ID_User_fkey";

-- DropForeignKey
ALTER TABLE "PurchaseHistory" DROP CONSTRAINT "PurchaseHistory_ID_User_fkey";

-- DropForeignKey
ALTER TABLE "Shop" DROP CONSTRAINT "Shop_ID_Achat_fkey";

-- DropForeignKey
ALTER TABLE "Shop" DROP CONSTRAINT "Shop_ID_Emote_fkey";

-- DropForeignKey
ALTER TABLE "Shop" DROP CONSTRAINT "Shop_ID_Item_fkey";

-- DropForeignKey
ALTER TABLE "Shop" DROP CONSTRAINT "Shop_ID_ThemeBG_fkey";

-- DropForeignKey
ALTER TABLE "Themes" DROP CONSTRAINT "Themes_ID_PP_fkey";

-- DropForeignKey
ALTER TABLE "Themes" DROP CONSTRAINT "Themes_ID_THCard_fkey";

-- DropForeignKey
ALTER TABLE "_RanksToUsers" DROP CONSTRAINT "_RanksToUsers_A_fkey";

-- DropForeignKey
ALTER TABLE "_RanksToUsers" DROP CONSTRAINT "_RanksToUsers_B_fkey";

-- AlterTable
ALTER TABLE "Friends" DROP CONSTRAINT "Friends_pkey",
ADD COLUMN     "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "ID_Friendship" SERIAL NOT NULL,
ALTER COLUMN "ID_Friend" DROP DEFAULT,
ALTER COLUMN "Connected" SET DEFAULT false,
ALTER COLUMN "Blocked" SET DEFAULT false,
ADD CONSTRAINT "Friends_pkey" PRIMARY KEY ("ID_Friendship");
DROP SEQUENCE "Friends_ID_Friend_seq";

-- AlterTable
ALTER TABLE "GameHistory" ADD COLUMN     "Mode" "GameModePersisted" NOT NULL DEFAULT 'pvp_quick',
ALTER COLUMN "DateGame" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "MMRWin" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "Money" INTEGER NOT NULL DEFAULT 100,
ALTER COLUMN "MMR" SET DEFAULT 0;

-- DropTable
DROP TABLE "Cards";

-- DropTable
DROP TABLE "Coupons";

-- DropTable
DROP TABLE "DailyGift";

-- DropTable
DROP TABLE "Emotes";

-- DropTable
DROP TABLE "Inventory";

-- DropTable
DROP TABLE "Items";

-- DropTable
DROP TABLE "Leaderboard";

-- DropTable
DROP TABLE "ProfilePictures";

-- DropTable
DROP TABLE "PurchaseHistory";

-- DropTable
DROP TABLE "Ranks";

-- DropTable
DROP TABLE "Shop";

-- DropTable
DROP TABLE "Themes";

-- DropTable
DROP TABLE "_RanksToUsers";

-- CreateTable
CREATE TABLE "CosmeticItem" (
    "id" SERIAL NOT NULL,
    "type" "CosmeticType" NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "basePrice" INTEGER NOT NULL,
    "rarity" "Rarity" NOT NULL DEFAULT 'common',
    "available" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CosmeticItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCosmetic" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "pricePaid" INTEGER NOT NULL,
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserCosmetic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquippedCosmetic" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "CosmeticType" NOT NULL,
    "itemId" INTEGER NOT NULL,

    CONSTRAINT "EquippedCosmetic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopOffer" (
    "id" SERIAL NOT NULL,
    "itemId" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ShopOffer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CosmeticItem_name_key" ON "CosmeticItem"("name");

-- CreateIndex
CREATE INDEX "CosmeticItem_type_available_idx" ON "CosmeticItem"("type", "available");

-- CreateIndex
CREATE INDEX "CosmeticItem_rarity_idx" ON "CosmeticItem"("rarity");

-- CreateIndex
CREATE INDEX "UserCosmetic_userId_idx" ON "UserCosmetic"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserCosmetic_userId_itemId_key" ON "UserCosmetic"("userId", "itemId");

-- CreateIndex
CREATE INDEX "EquippedCosmetic_userId_idx" ON "EquippedCosmetic"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EquippedCosmetic_userId_type_key" ON "EquippedCosmetic"("userId", "type");

-- CreateIndex
CREATE INDEX "ShopOffer_active_validUntil_idx" ON "ShopOffer"("active", "validUntil");

-- CreateIndex
CREATE UNIQUE INDEX "Friends_ID_User_ID_Friend_key" ON "Friends"("ID_User", "ID_Friend");

-- CreateIndex
CREATE INDEX "GameHistory_ID_User_Mode_DateGame_idx" ON "GameHistory"("ID_User", "Mode", "DateGame");

-- AddForeignKey
ALTER TABLE "Friends" ADD CONSTRAINT "Friends_ID_Friend_fkey" FOREIGN KEY ("ID_Friend") REFERENCES "Users"("ID_User") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCosmetic" ADD CONSTRAINT "UserCosmetic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("ID_User") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCosmetic" ADD CONSTRAINT "UserCosmetic_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "CosmeticItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquippedCosmetic" ADD CONSTRAINT "EquippedCosmetic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("ID_User") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquippedCosmetic" ADD CONSTRAINT "EquippedCosmetic_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "CosmeticItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopOffer" ADD CONSTRAINT "ShopOffer_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "CosmeticItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
