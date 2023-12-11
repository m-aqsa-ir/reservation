-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "orderTestMode" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Order" SET "orderTestMode"=true;
