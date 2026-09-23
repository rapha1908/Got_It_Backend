import { verifyToken } from "@/lib/jwt";

export type Context = {
  userId: number | null;
};

export function buildContext(authorization: string | undefined): Context {
  if (!authorization) {
    return { userId: null };
  }

  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return { userId: null };
  }

  return { userId: verifyToken(token) };
}
