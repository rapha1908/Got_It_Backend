import { Express } from "express";
import { loginController } from "./login";
import { meController } from "./me";
import { ensureAuth } from "@/http/middlewares/ensure-auth";

export async function authRoutes(app: Express) {
  app.post("/auth/login", loginController);
  app.get("/auth/me", ensureAuth, meController);
}
