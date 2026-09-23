import { AddressInfo } from "node:net";
import { Server } from "node:http";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "@/app";
import * as seed from "../helpers/factories";
import { tokenFor } from "../helpers/graphql";
import { resetDb } from "../helpers/reset-db";

let server: Server;
let url: string;

async function post(body: unknown, headers: Record<string, string> = {}) {
  const response = await fetch(`${url}/graphql`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}

describe("HTTP /graphql", () => {
  beforeAll(async () => {
    const app = await createApp();
    server = app.listen(0);
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

  beforeEach(resetDb);

  it("reads the Authorization header into the context", async () => {
    const user = await seed.seedUser({ name: "Ana" });

    const anonymous = await post({ query: "{ me { name } }" });
    expect(anonymous.body.errors[0].extensions.code).toBe("UNAUTHENTICATED");

    const authenticated = await post({ query: "{ me { name } }" }, { authorization: `Bearer ${tokenFor(user)}` });
    expect(authenticated.body).toEqual({ data: { me: { name: "Ana" } } });
  });

  it("no longer serves the REST API or Swagger", async () => {
    for (const path of ["/condominiums", "/docs", "/docs.json", "/auth/me"]) {
      const response = await fetch(`${url}${path}`);
      expect(response.status, path).toBe(404);
    }
  });
});
