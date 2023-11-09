-- CreateTable
CREATE TABLE "PhoneSentCode" (
    "id" SERIAL NOT NULL,
    "phone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "exp" INTEGER NOT NULL,

    CONSTRAINT "PhoneSentCode_pkey" PRIMARY KEY ("id")
);
