/*
  Warnings:

  - You are about to drop the `Roles` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Users" DROP CONSTRAINT "Users_idRole_fkey";

-- DropTable
DROP TABLE "Roles";

-- CreateTable
CREATE TABLE "azfazf" (
    "id" SERIAL NOT NULL,
    "roleName" VARCHAR(10) NOT NULL,

    CONSTRAINT "azfazf_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "azfazf_roleName_key" ON "azfazf"("roleName");

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_idRole_fkey" FOREIGN KEY ("idRole") REFERENCES "azfazf"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
