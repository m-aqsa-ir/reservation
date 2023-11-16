-- CreateTable
CREATE TABLE "GroupType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "iconPath" TEXT NOT NULL,

    CONSTRAINT "GroupType_pkey" PRIMARY KEY ("id")
);
