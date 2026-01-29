/*
  Warnings:

  - You are about to drop the `ScheduledPost` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('PENDING', 'PUBLISHED', 'FAILED', 'PARTIAL');

-- CreateEnum
CREATE TYPE "PostAccountStatus" AS ENUM ('PENDING', 'PUBLISHED', 'FAILED');

-- DropForeignKey
ALTER TABLE "ScheduledPost" DROP CONSTRAINT "ScheduledPost_socialAccountId_fkey";

-- DropTable
DROP TABLE "ScheduledPost";

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "status" "PostStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostAccount" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "socialAccountId" TEXT NOT NULL,
    "status" "PostAccountStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PostAccount_postId_socialAccountId_key" ON "PostAccount"("postId", "socialAccountId");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostAccount" ADD CONSTRAINT "PostAccount_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostAccount" ADD CONSTRAINT "PostAccount_socialAccountId_fkey" FOREIGN KEY ("socialAccountId") REFERENCES "SocialAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
