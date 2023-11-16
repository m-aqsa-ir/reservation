-- CreateTable
CREATE TABLE "_DayToGroupType" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_DayToGroupType_AB_unique" ON "_DayToGroupType"("A", "B");

-- CreateIndex
CREATE INDEX "_DayToGroupType_B_index" ON "_DayToGroupType"("B");

-- AddForeignKey
ALTER TABLE "_DayToGroupType" ADD CONSTRAINT "_DayToGroupType_A_fkey" FOREIGN KEY ("A") REFERENCES "Day"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DayToGroupType" ADD CONSTRAINT "_DayToGroupType_B_fkey" FOREIGN KEY ("B") REFERENCES "GroupType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
