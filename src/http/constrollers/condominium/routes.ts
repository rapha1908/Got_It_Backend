import { Express } from "express";
import { createCondominiumController } from "./create";

export async function condominiumRoutes(app: Express) {
  app.post("/condominiums", createCondominiumController);
}
