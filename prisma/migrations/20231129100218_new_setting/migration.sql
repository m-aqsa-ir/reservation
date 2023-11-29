-- AlterTable
ALTER TABLE "AppConfig" ADD COLUMN     "appTestMode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymentPortalMerchantId" TEXT NOT NULL DEFAULT '';
