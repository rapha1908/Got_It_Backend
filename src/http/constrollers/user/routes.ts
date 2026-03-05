import { createUserController } from "./create";
import { Express } from "express";

export async function userRoutes(app: Express) {
  app.post("/users", createUserController);
}
