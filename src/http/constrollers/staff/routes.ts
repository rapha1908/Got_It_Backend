import { Express } from "express";
import { createStaffController } from "./create";
import { findStaffController } from "./find";

export async function staffRoutes(app: Express) {
  app.post("/staff", createStaffController);
  app.get("/staff/:user_id", findStaffController);
}
