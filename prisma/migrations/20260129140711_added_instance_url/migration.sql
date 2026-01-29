/*
  Warnings:

  - You are about to drop the column `expiresAt` on the `SocialAccount` table. All the data in the column will be lost.
  - You are about to drop the column `refreshToken` on the `SocialAccount` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SocialAccount" DROP COLUMN "expiresAt",
DROP COLUMN "refreshToken",
ADD COLUMN     "instanceUrl" TEXT;
