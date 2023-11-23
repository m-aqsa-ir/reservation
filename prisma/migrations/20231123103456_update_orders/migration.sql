-- This is an empty migration.
UPDATE "Order"
SET "orderStatus"='reserved'
WHERE status!='await-payment';