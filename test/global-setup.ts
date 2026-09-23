import { execSync } from "node:child_process";
import { assertTestDatabase, loadTestEnv } from "./helpers/test-env";

export default function setup(): void {
  const testEnv = loadTestEnv();
  assertTestDatabase(testEnv.DATABASE_URL);
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, ...testEnv },
  });
}
