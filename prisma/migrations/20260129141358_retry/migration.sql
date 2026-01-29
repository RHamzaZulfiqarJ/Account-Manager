-- AlterTable
ALTER TABLE "SocialAccount" ADD COLUMN     "refreshToken" TEXT,
ADD COLUMN     "tokenExpiry" TIMESTAMP(3);
