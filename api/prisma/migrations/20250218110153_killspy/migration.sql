-- DropForeignKey
ALTER TABLE "Friends" DROP CONSTRAINT "Friends_ID_User_fkey";

-- DropForeignKey
ALTER TABLE "GameHistory" DROP CONSTRAINT "GameHistory_ID_User_fkey";

-- DropForeignKey
ALTER TABLE "Inventory" DROP CONSTRAINT "Inventory_ID_ThemeBG_fkey";

-- DropForeignKey
ALTER TABLE "Inventory" DROP CONSTRAINT "Inventory_ID_User_fkey";

-- DropForeignKey
ALTER TABLE "Leaderboard" DROP CONSTRAINT "Leaderboard_ID_User_fkey";

-- DropForeignKey
ALTER TABLE "PurchaseHistory" DROP CONSTRAINT "PurchaseHistory_ID_User_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_ID_User_fkey";

-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isGuest" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_ID_User_fkey" FOREIGN KEY ("ID_User") REFERENCES "Users"("ID_User") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friends" ADD CONSTRAINT "Friends_ID_User_fkey" FOREIGN KEY ("ID_User") REFERENCES "Users"("ID_User") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameHistory" ADD CONSTRAINT "GameHistory_ID_User_fkey" FOREIGN KEY ("ID_User") REFERENCES "Users"("ID_User") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseHistory" ADD CONSTRAINT "PurchaseHistory_ID_User_fkey" FOREIGN KEY ("ID_User") REFERENCES "Users"("ID_User") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Leaderboard" ADD CONSTRAINT "Leaderboard_ID_User_fkey" FOREIGN KEY ("ID_User") REFERENCES "Users"("ID_User") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_ID_ThemeBG_fkey" FOREIGN KEY ("ID_ThemeBG") REFERENCES "Themes"("ID_ThemeBG") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_ID_User_fkey" FOREIGN KEY ("ID_User") REFERENCES "Users"("ID_User") ON DELETE CASCADE ON UPDATE CASCADE;
