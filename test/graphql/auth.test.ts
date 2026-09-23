import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma/db";
import * as seed from "../helpers/factories";
import { execute, tokenFor } from "../helpers/graphql";
import { resetDb } from "../helpers/reset-db";

const CREATE_USER = /* GraphQL */ `
  mutation ($input: CreateUserInput!) {
    createUser(input: $input) { id name email type }
  }
`;

const LOGIN = /* GraphQL */ `
  mutation ($input: LoginInput!) {
    login(input: $input) { token user { id email } }
  }
`;

const ME = /* GraphQL */ `
  query { me { id name email type } }
`;

const validUser = { name: "Ana", email: "ana@test.com", password: "password123", type: "Manager" };

describe("auth and user", () => {
  beforeEach(resetDb);

  it("createUser works without a token and never exposes password", async () => {
    const result = await execute(CREATE_USER, { input: validUser });

    expect(result.errors).toBeUndefined();
    expect(result.data?.createUser).toEqual({ id: expect.any(Number), name: "Ana", email: "ana@test.com", type: "Manager" });

    const stored = await prisma.user.findUniqueOrThrow({ where: { email: "ana@test.com" } });
    expect(stored.password).not.toBe("password123");

    const introspection = await execute(`{ __type(name: "User") { fields { name } } }`);
    const fieldNames = introspection.data?.__type.fields.map((f: { name: string }) => f.name);
    expect(fieldNames).not.toContain("password");
  });

  it("createUser rejects invalid input with BAD_USER_INPUT without touching the database", async () => {
    const result = await execute(CREATE_USER, { input: { ...validUser, email: "not-an-email" } });

    expect(result.errors?.[0].extensions?.code).toBe("BAD_USER_INPUT");
    await expect(prisma.user.count()).resolves.toBe(0);
  });

  it("createUser rejects short passwords with BAD_USER_INPUT", async () => {
    const result = await execute(CREATE_USER, { input: { ...validUser, password: "short" } });
    expect(result.errors?.[0].extensions?.code).toBe("BAD_USER_INPUT");
  });

  it("createUser with a duplicate email returns BAD_USER_INPUT", async () => {
    await execute(CREATE_USER, { input: validUser });
    const result = await execute(CREATE_USER, { input: validUser });

    expect(result.errors?.[0]).toEqual(
      expect.objectContaining({ message: "Resource already exists", extensions: expect.objectContaining({ code: "BAD_USER_INPUT" }) }),
    );
  });

  it("login with wrong credentials returns UNAUTHENTICATED", async () => {
    await seed.seedUser({ email: "ana@test.com" });

    for (const input of [
      { email: "ana@test.com", password: "wrong-password" },
      { email: "nobody@test.com", password: seed.DEFAULT_PASSWORD },
    ]) {
      const result = await execute(LOGIN, { input });
      expect(result.errors?.[0]).toEqual(
        expect.objectContaining({ message: "Invalid credentials", extensions: expect.objectContaining({ code: "UNAUTHENTICATED" }) }),
      );
    }
  });

  it("login returns a token that authenticates me", async () => {
    const user = await seed.seedUser({ email: "ana@test.com", name: "Ana" });

    const login = await execute(LOGIN, { input: { email: "ana@test.com", password: seed.DEFAULT_PASSWORD } });
    expect(login.errors).toBeUndefined();
    expect(login.data?.login.user).toEqual({ id: user.id, email: "ana@test.com" });

    const me = await execute(ME, {}, login.data?.login.token);
    expect(me.errors).toBeUndefined();
    expect(me.data?.me).toEqual({ id: user.id, name: "Ana", email: "ana@test.com", type: "Manager" });
  });

  it("me without a token returns UNAUTHENTICATED", async () => {
    const result = await execute(ME);
    expect(result.errors?.[0]).toEqual(
      expect.objectContaining({ message: "Not authenticated", extensions: expect.objectContaining({ code: "UNAUTHENTICATED" }) }),
    );
  });

  it("me for a token whose user no longer exists returns NOT_FOUND", async () => {
    const result = await execute(ME, {}, tokenFor({ id: 999, type: "Manager" }));
    expect(result.errors?.[0].extensions?.code).toBe("NOT_FOUND");
  });

  it("user(email) returns the user or null", async () => {
    const viewer = await seed.seedUser();
    await seed.seedUser({ email: "bia@test.com", name: "Bia" });
    const query = `query ($email: String!) { user(email: $email) { name } }`;

    expect((await execute(query, { email: "bia@test.com" }, tokenFor(viewer))).data?.user).toEqual({ name: "Bia" });
    expect((await execute(query, { email: "none@test.com" }, tokenFor(viewer))).data?.user).toBeNull();
    expect((await execute(query, { email: "bad" }, tokenFor(viewer))).errors?.[0].extensions?.code).toBe("BAD_USER_INPUT");
  });
});
