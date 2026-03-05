import { createUserController } from "./create";
import { Express } from "express";
import { findUserController } from "./find";

export async function userRoutes(app: Express) {
  app.post("/users", createUserController);
  app.get("/users/:email", findUserController);
}
