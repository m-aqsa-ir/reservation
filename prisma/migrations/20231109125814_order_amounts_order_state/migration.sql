/*
  Warnings:

  - You are about to drop the column `canceled` on the `Order` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "canceled",
ADD COLUMN     "calculatedAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "prePayAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'await-payment';

-- CreateTable
CREATE TABLE "AppConfig" (
    "id" SERIAL NOT NULL,
    "prePayDiscount" INTEGER NOT NULL,

    CONSTRAINT "AppConfig_pkey" PRIMARY KEY ("id")
);
