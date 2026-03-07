import { env } from "@/env";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

type TokenPayload = {
  sub: string;
};

const routeFreeList = ["POST:/users", "POST:/auth/login"];

export function ensureAuth(req: Request, res: Response, next: NextFunction) {
  const validateRoute = `${req.method.toUpperCase()}:${req.path}`;

  if (routeFreeList.includes(validateRoute) || req.method.toUpperCase() === "OPTIONS") {
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Token missing" });
  }

  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Invalid token format" });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    res.locals.userId = Number(decoded.sub);
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
