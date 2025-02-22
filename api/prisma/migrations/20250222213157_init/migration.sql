/*
  Warnings:

  - Added the required column `deletionDate` to the `Users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "archived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "deletionDate" TIMESTAMP(3) NOT NULL;
