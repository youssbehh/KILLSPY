/*
  Warnings:

  - You are about to drop the column `ID_User` on the `Roles` table. All the data in the column will be lost.
  - You are about to drop the `_RanksToUsers` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `ID_Rank` to the `Users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ID_Role` to the `Users` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Roles" DROP CONSTRAINT "Roles_ID_User_fkey";

-- DropForeignKey
ALTER TABLE "_RanksToUsers" DROP CONSTRAINT "_RanksToUsers_A_fkey";

-- DropForeignKey
ALTER TABLE "_RanksToUsers" DROP CONSTRAINT "_RanksToUsers_B_fkey";

-- AlterTable
ALTER TABLE "Roles" DROP COLUMN "ID_User";

-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "ID_Rank" INTEGER NOT NULL,
ADD COLUMN     "ID_Role" INTEGER NOT NULL;

-- DropTable
DROP TABLE "_RanksToUsers";

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_ID_Role_fkey" FOREIGN KEY ("ID_Role") REFERENCES "Roles"("ID_Role") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_ID_Rank_fkey" FOREIGN KEY ("ID_Rank") REFERENCES "Ranks"("ID_Rank") ON DELETE RESTRICT ON UPDATE CASCADE;
