import path from "node:path";
import { defineConfig } from "vitest/config";
import { loadTestEnv } from "./test/helpers/test-env";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(process.cwd(), "src") },
  },
  test: {
    env: loadTestEnv(),
    globalSetup: ["./test/global-setup.ts"],
    include: ["test/**/*.test.ts"],
    fileParallelism: false,
  },
});
