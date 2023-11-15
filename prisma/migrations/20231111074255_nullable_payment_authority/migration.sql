-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "paymentAuthority" DROP NOT NULL,
ALTER COLUMN "paymentAuthority" DROP DEFAULT;
