-- AlterTable
ALTER TABLE "Day" ALTER COLUMN "minVolume" SET DEFAULT 0;

UPDATE "Day"
SET "minVolume"=0
WHERE "minVolume"=NULL;
