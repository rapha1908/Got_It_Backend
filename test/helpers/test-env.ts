import { readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "dotenv";

export const TEST_DATABASE_HOST = "localhost:5433";

export function loadTestEnv(): Record<string, string> {
  return parse(readFileSync(path.resolve(process.cwd(), ".env.test")));
}

export function assertTestDatabase(url: string | undefined): void {
  if (!url || !url.includes(`@${TEST_DATABASE_HOST}/`)) {
    throw new Error(
      `Refusing to touch a non-test database: DATABASE_URL must point to ${TEST_DATABASE_HOST}`,
    );
  }
}
