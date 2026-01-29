/*
  Warnings:

  - You are about to drop the `Post` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PostAccount` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_userId_fkey";

-- DropForeignKey
ALTER TABLE "PostAccount" DROP CONSTRAINT "PostAccount_postId_fkey";

-- DropForeignKey
ALTER TABLE "PostAccount" DROP CONSTRAINT "PostAccount_socialAccountId_fkey";

-- DropTable
DROP TABLE "Post";

-- DropTable
DROP TABLE "PostAccount";

-- DropEnum
DROP TYPE "PostAccountStatus";

-- DropEnum
DROP TYPE "PostStatus";

-- CreateTable
CREATE TABLE "ScheduledPost" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "postedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "socialAccountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduledPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScheduledPost_status_idx" ON "ScheduledPost"("status");

-- CreateIndex
CREATE INDEX "ScheduledPost_scheduledAt_idx" ON "ScheduledPost"("scheduledAt");

-- AddForeignKey
ALTER TABLE "ScheduledPost" ADD CONSTRAINT "ScheduledPost_socialAccountId_fkey" FOREIGN KEY ("socialAccountId") REFERENCES "SocialAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
