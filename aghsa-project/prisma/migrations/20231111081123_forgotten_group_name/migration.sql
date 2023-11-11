-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_customerId_fkey";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "groupName" TEXT NOT NULL DEFAULT '';
