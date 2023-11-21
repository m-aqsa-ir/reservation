-- AlterTable
ALTER TABLE "AppConfig" ALTER COLUMN "prePayDiscount" SET DEFAULT 30,
ALTER COLUMN "appLogoPath" SET DEFAULT '',
ALTER COLUMN "appName" SET DEFAULT '',
ALTER COLUMN "daysBeforeDayToReserve" SET DEFAULT 3,
ALTER COLUMN "doSendMessageToManagerInBale" SET DEFAULT false,
ALTER COLUMN "doSendSmsToManager" SET DEFAULT false,
ALTER COLUMN "managerPhoneNum" SET DEFAULT '',
ALTER COLUMN "mangerBaleId" SET DEFAULT '';

INSERT INTO public."AppConfig"
    ("prePayDiscount", "daysBeforeDayToReserve", "doSendMessageToManagerInBale", "doSendSmsToManager")
VALUES
    (30, 3, false, false);
