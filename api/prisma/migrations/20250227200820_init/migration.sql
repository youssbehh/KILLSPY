-- CreateTable
CREATE TABLE "Users" (
    "ID_User" SERIAL NOT NULL,
    "Username" TEXT NOT NULL,
    "Email" TEXT NOT NULL,
    "Password" TEXT NOT NULL,
    "MMR" INTEGER NOT NULL,
    "isGuest" BOOLEAN NOT NULL DEFAULT false,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "deletionDate" TIMESTAMP(3),

    CONSTRAINT "Users_pkey" PRIMARY KEY ("ID_User")
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
CREATE TABLE "Roles" (
    "ID_Role" SERIAL NOT NULL,
    "Role" TEXT NOT NULL,
    "ID_User" INTEGER NOT NULL,

    CONSTRAINT "Roles_pkey" PRIMARY KEY ("ID_Role")
);

-- CreateTable
CREATE TABLE "Ranks" (
    "ID_Rank" SERIAL NOT NULL,
    "RankName" TEXT NOT NULL,
    "MMR_Range" TEXT NOT NULL,

    CONSTRAINT "Ranks_pkey" PRIMARY KEY ("ID_Rank")
);

-- CreateTable
CREATE TABLE "Emotes" (
    "ID_Emote" SERIAL NOT NULL,
    "EmoteName" TEXT NOT NULL,
    "EmotePicture" TEXT NOT NULL,

    CONSTRAINT "Emotes_pkey" PRIMARY KEY ("ID_Emote")
);

-- CreateTable
CREATE TABLE "DailyGift" (
    "ID_Dailygift" SERIAL NOT NULL,
    "ClaimedAt" TIMESTAMP(3) NOT NULL,
    "Gift_Item" TEXT NOT NULL,

    CONSTRAINT "DailyGift_pkey" PRIMARY KEY ("ID_Dailygift")
);

-- CreateTable
CREATE TABLE "ProfilePictures" (
    "ID_PP" SERIAL NOT NULL,
    "PPName" TEXT NOT NULL,
    "PP" TEXT NOT NULL,

    CONSTRAINT "ProfilePictures_pkey" PRIMARY KEY ("ID_PP")
);

-- CreateTable
CREATE TABLE "Cards" (
    "ID_THCard" SERIAL NOT NULL,
    "THCardName" TEXT NOT NULL,
    "THCard" TEXT NOT NULL,

    CONSTRAINT "Cards_pkey" PRIMARY KEY ("ID_THCard")
);

-- CreateTable
CREATE TABLE "Coupons" (
    "ID_Coupon" SERIAL NOT NULL,
    "Code" TEXT NOT NULL,
    "State" BOOLEAN NOT NULL,
    "Qty" INTEGER NOT NULL,

    CONSTRAINT "Coupons_pkey" PRIMARY KEY ("ID_Coupon")
);

-- CreateTable
CREATE TABLE "Themes" (
    "ID_ThemeBG" SERIAL NOT NULL,
    "ThemeBGName" TEXT NOT NULL,
    "ThemeBG" TEXT NOT NULL,
    "ID_THCard" INTEGER NOT NULL,
    "ID_PP" INTEGER NOT NULL,

    CONSTRAINT "Themes_pkey" PRIMARY KEY ("ID_ThemeBG")
);

-- CreateTable
CREATE TABLE "Friends" (
    "ID_Friend" SERIAL NOT NULL,
    "Connected" BOOLEAN NOT NULL,
    "Blocked" BOOLEAN NOT NULL,
    "ID_User" INTEGER NOT NULL,

    CONSTRAINT "Friends_pkey" PRIMARY KEY ("ID_Friend")
);

-- CreateTable
CREATE TABLE "GameHistory" (
    "ID_GameHistory" SERIAL NOT NULL,
    "V_D" BOOLEAN NOT NULL,
    "DateGame" TIMESTAMP(3) NOT NULL,
    "MMRWin" INTEGER NOT NULL,
    "ID_User" INTEGER NOT NULL,

    CONSTRAINT "GameHistory_pkey" PRIMARY KEY ("ID_GameHistory")
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
CREATE TABLE "Leaderboard" (
    "ID_Leaderboard" SERIAL NOT NULL,
    "ID_User" INTEGER NOT NULL,

    CONSTRAINT "Leaderboard_pkey" PRIMARY KEY ("ID_Leaderboard")
);

-- CreateTable
CREATE TABLE "Items" (
    "ID_Item" SERIAL NOT NULL,
    "ItemName" TEXT NOT NULL,
    "ItemPrice" DOUBLE PRECISION NOT NULL,
    "ItemImage" TEXT NOT NULL,
    "ItemOutDate" TIMESTAMP(3) NOT NULL,
    "ItemDisplay" BOOLEAN NOT NULL,
    "Stock" INTEGER NOT NULL,

    CONSTRAINT "Items_pkey" PRIMARY KEY ("ID_Item")
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
CREATE TABLE "_RanksToUsers" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_RanksToUsers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_Username_key" ON "Users"("Username");

-- CreateIndex
CREATE UNIQUE INDEX "Users_Email_key" ON "Users"("Email");

-- CreateIndex
CREATE UNIQUE INDEX "Coupons_Code_key" ON "Coupons"("Code");

-- CreateIndex
CREATE UNIQUE INDEX "Leaderboard_ID_User_key" ON "Leaderboard"("ID_User");

-- CreateIndex
CREATE INDEX "_RanksToUsers_B_index" ON "_RanksToUsers"("B");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_ID_User_fkey" FOREIGN KEY ("ID_User") REFERENCES "Users"("ID_User") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Roles" ADD CONSTRAINT "Roles_ID_User_fkey" FOREIGN KEY ("ID_User") REFERENCES "Users"("ID_User") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Themes" ADD CONSTRAINT "Themes_ID_THCard_fkey" FOREIGN KEY ("ID_THCard") REFERENCES "Cards"("ID_THCard") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Themes" ADD CONSTRAINT "Themes_ID_PP_fkey" FOREIGN KEY ("ID_PP") REFERENCES "ProfilePictures"("ID_PP") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friends" ADD CONSTRAINT "Friends_ID_User_fkey" FOREIGN KEY ("ID_User") REFERENCES "Users"("ID_User") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameHistory" ADD CONSTRAINT "GameHistory_ID_User_fkey" FOREIGN KEY ("ID_User") REFERENCES "Users"("ID_User") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseHistory" ADD CONSTRAINT "PurchaseHistory_ID_User_fkey" FOREIGN KEY ("ID_User") REFERENCES "Users"("ID_User") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Leaderboard" ADD CONSTRAINT "Leaderboard_ID_User_fkey" FOREIGN KEY ("ID_User") REFERENCES "Users"("ID_User") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shop" ADD CONSTRAINT "Shop_ID_ThemeBG_fkey" FOREIGN KEY ("ID_ThemeBG") REFERENCES "Themes"("ID_ThemeBG") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shop" ADD CONSTRAINT "Shop_ID_Achat_fkey" FOREIGN KEY ("ID_Achat") REFERENCES "PurchaseHistory"("ID_Achat") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shop" ADD CONSTRAINT "Shop_ID_Emote_fkey" FOREIGN KEY ("ID_Emote") REFERENCES "Emotes"("ID_Emote") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shop" ADD CONSTRAINT "Shop_ID_Item_fkey" FOREIGN KEY ("ID_Item") REFERENCES "Items"("ID_Item") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_ID_ThemeBG_fkey" FOREIGN KEY ("ID_ThemeBG") REFERENCES "Themes"("ID_ThemeBG") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_ID_User_fkey" FOREIGN KEY ("ID_User") REFERENCES "Users"("ID_User") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RanksToUsers" ADD CONSTRAINT "_RanksToUsers_A_fkey" FOREIGN KEY ("A") REFERENCES "Ranks"("ID_Rank") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RanksToUsers" ADD CONSTRAINT "_RanksToUsers_B_fkey" FOREIGN KEY ("B") REFERENCES "Users"("ID_User") ON DELETE CASCADE ON UPDATE CASCADE;
