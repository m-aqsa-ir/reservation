/*
  Warnings:

  - Added the required column `appLogoPath` to the `AppConfig` table without a default value. This is not possible if the table is not empty.
  - Added the required column `appName` to the `AppConfig` table without a default value. This is not possible if the table is not empty.
  - Added the required column `daysBeforeDayToReserve` to the `AppConfig` table without a default value. This is not possible if the table is not empty.
  - Added the required column `doSendMessageToManagerInBale` to the `AppConfig` table without a default value. This is not possible if the table is not empty.
  - Added the required column `doSendSmsToManager` to the `AppConfig` table without a default value. This is not possible if the table is not empty.
  - Added the required column `managerPhoneNum` to the `AppConfig` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mangerBaleId` to the `AppConfig` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AppConfig" ADD COLUMN     "appLogoPath" TEXT NOT NULL,
ADD COLUMN     "appName" TEXT NOT NULL,
ADD COLUMN     "daysBeforeDayToReserve" INTEGER NOT NULL,
ADD COLUMN     "doSendMessageToManagerInBale" BOOLEAN NOT NULL,
ADD COLUMN     "doSendSmsToManager" BOOLEAN NOT NULL,
ADD COLUMN     "managerPhoneNum" TEXT NOT NULL,
ADD COLUMN     "mangerBaleId" TEXT NOT NULL;
