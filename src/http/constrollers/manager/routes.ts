import { createManagerController } from "./create";
import { Express } from "express";
import { findManagerController } from "./find";

export async function managerRoutes(app: Express) {
  app.post("/managers", createManagerController);
  app.get("/managers/:user_id", findManagerController);
}
