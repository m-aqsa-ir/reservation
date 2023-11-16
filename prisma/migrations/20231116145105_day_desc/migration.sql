/*
  Warnings:

  - A unique constraint covering the columns `[day,month,year,desc]` on the table `Day` will be added. If there are existing duplicate values, this will fail.
  - Made the column `desc` on table `Day` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Day_day_month_year_key";

-- AlterTable
ALTER TABLE "Day" ALTER COLUMN "desc" SET NOT NULL,
ALTER COLUMN "desc" SET DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "Day_day_month_year_desc_key" ON "Day"("day", "month", "year", "desc");
