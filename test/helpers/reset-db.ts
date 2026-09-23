import { prisma } from "@/lib/prisma/db";
import { assertTestDatabase } from "./test-env";

const TABLES = [
  "check_list_items",
  "check_lists",
  "photo_services",
  "services",
  "staff_skills",
  "skills",
  "staff",
  "condominium_managers",
  "condominiums",
  "managers",
  "users",
];

export async function resetDb(): Promise<void> {
  assertTestDatabase(process.env.DATABASE_URL);
  const tables = TABLES.map((table) => `"${table}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`);
}
