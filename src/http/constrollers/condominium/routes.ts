import { Express } from "express";
import { createCondominiumController } from "./create";
import { findCondominiumsController } from "./find";
import { findServicesByCondominiumController } from "./find-services";

export async function condominiumRoutes(app: Express) {
  app.post("/condominiums", createCondominiumController);
  app.get("/condominiums", findCondominiumsController);
  app.get("/condominiums/:condominium_id/services", findServicesByCondominiumController);
}
