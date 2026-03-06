CREATE TABLE IF NOT EXISTS "condominium_managers" (
  "id" SERIAL NOT NULL,
  "condominium_id" INTEGER NOT NULL,
  "manager_id" INTEGER NOT NULL,
  CONSTRAINT "condominium_managers_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "condominium_managers_condominium_id_manager_id_key" UNIQUE ("condominium_id", "manager_id"),
  CONSTRAINT "condominium_managers_condominium_id_fkey" FOREIGN KEY ("condominium_id") REFERENCES "condominiums"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "condominium_managers_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "managers"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "condominium_managers" ("condominium_id", "manager_id")
SELECT "id", "manager_id"
FROM "condominiums"
WHERE "manager_id" IS NOT NULL
ON CONFLICT ("condominium_id", "manager_id") DO NOTHING;

ALTER TABLE "condominiums" DROP CONSTRAINT IF EXISTS "condominiums_manager_id_fkey";
ALTER TABLE "condominiums" DROP COLUMN IF EXISTS "manager_id";
