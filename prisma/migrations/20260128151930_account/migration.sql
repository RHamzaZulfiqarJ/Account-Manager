/*
  Warnings:

  - A unique constraint covering the columns `[platform,accountId]` on the table `SocialAccount` will be added. If there are existing duplicate values, this will fail.
  - Made the column `accountId` on table `SocialAccount` required. This step will fail if there are existing NULL values in that column.
  - Made the column `accountUsername` on table `SocialAccount` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "SocialAccount" ALTER COLUMN "accountId" SET NOT NULL,
ALTER COLUMN "accountUsername" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "SocialAccount_platform_accountId_key" ON "SocialAccount"("platform", "accountId");
