/*
  Warnings:

  - A unique constraint covering the columns `[payId]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Transaction_payId_key" ON "Transaction"("payId");
