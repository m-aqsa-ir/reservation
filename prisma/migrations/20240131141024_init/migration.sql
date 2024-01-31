-- CreateTable
CREATE TABLE "Customer" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "nationalCode" TEXT NOT NULL,
    "desc" TEXT,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" SERIAL NOT NULL,
    "amount" INTEGER NOT NULL,
    "desc" TEXT NOT NULL DEFAULT '',
    "chequeStatus" TEXT NOT NULL DEFAULT 'not-checked',
    "needPayment" BOOLEAN NOT NULL DEFAULT false,
    "timeRegistered" INTEGER NOT NULL,
    "customerId" INTEGER NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" SERIAL NOT NULL,
    "timeCreated" INTEGER NOT NULL,
    "valuePaid" INTEGER NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "successful" BOOLEAN NOT NULL DEFAULT false,
    "payId" TEXT NOT NULL,
    "payPortal" TEXT NOT NULL,
    "payTime" INTEGER NOT NULL,
    "orderId" INTEGER NOT NULL,
    "customerId" INTEGER NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppConfig" (
    "id" SERIAL NOT NULL,
    "doSendSmsToManager" BOOLEAN NOT NULL DEFAULT false,
    "managerPhoneNum" TEXT NOT NULL DEFAULT '',
    "doSendMessageToManagerInBale" BOOLEAN NOT NULL DEFAULT false,
    "mangerBaleId" TEXT NOT NULL DEFAULT '',
    "appName" TEXT NOT NULL DEFAULT '',
    "appLogoPath" TEXT NOT NULL DEFAULT '',
    "ticketTermsAndServices" TEXT NOT NULL DEFAULT '',
    "appTestMode" BOOLEAN NOT NULL DEFAULT false,
    "paymentPortalMerchantId" TEXT NOT NULL DEFAULT '',
    "payValue" INTEGER NOT NULL DEFAULT 0,
    "payNeeded" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AppConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_phone_key" ON "Customer"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_username_key" ON "AdminUser"("username");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
