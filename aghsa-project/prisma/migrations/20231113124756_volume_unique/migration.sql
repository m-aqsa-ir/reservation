/*
  Warnings:

  - A unique constraint covering the columns `[volume]` on the table `VolumeList` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "VolumeList_volume_key" ON "VolumeList"("volume");
