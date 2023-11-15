/*
  Warnings:

  - A unique constraint covering the columns `[day,month,year]` on the table `Day` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Customer" ALTER COLUMN "desc" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Day" ALTER COLUMN "desc" DROP NOT NULL,
ALTER COLUMN "minVolume" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "desc" TEXT;

-- AlterTable
ALTER TABLE "Service" ALTER COLUMN "desc" DROP NOT NULL,
ALTER COLUMN "type" SET DEFAULT 'service',
ALTER COLUMN "priceVip" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Day_day_month_year_key" ON "Day"("day", "month", "year");
