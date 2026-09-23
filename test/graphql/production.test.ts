import { afterEach, describe, expect, it } from "vitest";
import { env } from "@/env";
import { createApolloServer } from "@/graphql/server";

describe("production hardening", () => {
  const originalNodeEnv = env.NODE_ENV;

  afterEach(() => {
    env.NODE_ENV = originalNodeEnv;
  });

  async function executeInProduction(query: string) {
    env.NODE_ENV = "production";
    const server = createApolloServer();
    const response = await server.executeOperation({ query }, { contextValue: { userId: null } });
    if (response.body.kind !== "single") throw new Error("Expected a single GraphQL result");
    return response.body.singleResult;
  }

  it("does not suggest field names for typos, so the schema cannot be mapped anonymously", async () => {
    const result = await executeInProduction("{ condominiumz { id } }");

    expect(result.errors?.[0].message).not.toMatch(/Did you mean/);
  });

  it("disables introspection", async () => {
    const result = await executeInProduction("{ __schema { types { name } } }");

    expect(result.errors?.[0].message).toMatch(/introspection/i);
  });
});
