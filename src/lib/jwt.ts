import jwt from "jsonwebtoken";
import { env } from "@/env";

type TokenPayload = {
  sub: string;
};

export function signToken(user: { id: number; type: string }): string {
  return jwt.sign({ type: user.type }, env.JWT_SECRET, {
    subject: String(user.id),
    expiresIn: "1d",
  });
}

export function verifyToken(token: string): number | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    const userId = Number(decoded.sub);
    return Number.isInteger(userId) ? userId : null;
  } catch {
    return null;
  }
}
