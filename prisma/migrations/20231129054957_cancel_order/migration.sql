-- CreateTable
CREATE TABLE "OrderCancel" (
    "id" SERIAL NOT NULL,
    "reason" TEXT NOT NULL,
    "orderId" INTEGER NOT NULL,

    CONSTRAINT "OrderCancel_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OrderCancel" ADD CONSTRAINT "OrderCancel_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
