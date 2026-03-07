import { Express } from "express";
import { loginController } from "./login";
import { meController } from "./me";

export async function authRoutes(app: Express) {
  app.post("/auth/login", loginController);
  app.get("/auth/me", meController);
}
