import { createManagerController } from "./create";
import { Express } from "express";

export async function managerRoutes(app: Express) {
  app.post("/managers", createManagerController);
}
