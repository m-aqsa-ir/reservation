/*
  Warnings:

  - You are about to drop the column `doSendSmsAfterCancel` on the `AppConfig` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AppConfig" DROP COLUMN "doSendSmsAfterCancel",
ADD COLUMN     "dayBeforeDayToCancel" INTEGER NOT NULL DEFAULT 1;
