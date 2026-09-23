import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma/db";
import { resetDb } from "./helpers/reset-db";
import { assertTestDatabase } from "./helpers/test-env";

describe("test infrastructure", () => {
  beforeEach(resetDb);

  it("connects to the test database with an empty schema", async () => {
    expect(process.env.DATABASE_URL).toContain("@localhost:5433/");
    await expect(prisma.user.count()).resolves.toBe(0);
  });

  it("refuses to touch a non-test database", () => {
    expect(() =>
      assertTestDatabase("postgresql://u:p@ep-x-pooler.eu-central-1.aws.neon.tech/neondb"),
    ).toThrow(/non-test database/);
    expect(() => assertTestDatabase("postgresql://u:p@localhost:5432/postgres")).toThrow(
      /non-test database/,
    );
    expect(() => assertTestDatabase(undefined)).toThrow(/non-test database/);
  });
});
