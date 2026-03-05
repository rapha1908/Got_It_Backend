import { Express } from "express";
import { createServiceController } from "./create";

export async function serviceRoutes(app: Express) {
  app.post("/services", createServiceController);
}
