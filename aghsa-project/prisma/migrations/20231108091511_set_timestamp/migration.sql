/*
  Warnings:

  - Added the required column `timeRegistered` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `payDateTimestamp` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Day" ADD COLUMN     "timestamp" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "timeRegistered" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "payDateTimestamp" INTEGER NOT NULL;
