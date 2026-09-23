import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import { buildContext } from "@/graphql/context";
import { signToken } from "@/lib/jwt";

describe("buildContext", () => {
  const secret = process.env.JWT_SECRET!;

  it("extracts the user id from a valid Bearer token", () => {
    expect(buildContext(`Bearer ${signToken({ id: 42, type: "Manager" })}`)).toEqual({ userId: 42 });
  });

  it.each([
    ["missing header", undefined],
    ["empty header", ""],
    ["wrong scheme", `Basic ${signToken({ id: 1, type: "Manager" })}`],
    ["Bearer without token", "Bearer"],
    ["malformed token", "Bearer not-a-jwt"],
    ["wrong secret", `Bearer ${jwt.sign({}, "other-secret", { subject: "1" })}`],
    ["expired token", `Bearer ${jwt.sign({}, secret, { subject: "1", expiresIn: -10 })}`],
    ["non-numeric subject", `Bearer ${jwt.sign({}, secret, { subject: "abc" })}`],
  ])("returns userId null for %s", (_label, header) => {
    expect(buildContext(header)).toEqual({ userId: null });
  });
});
