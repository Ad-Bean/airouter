/*
  Warnings:

  - You are about to drop the column `deleted` on the `chat_sessions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "chat_sessions" DROP COLUMN "deleted";

-- AlterTable
ALTER TABLE "generated_images" ADD COLUMN     "autoDeleteAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "plan" TEXT NOT NULL DEFAULT 'free';
