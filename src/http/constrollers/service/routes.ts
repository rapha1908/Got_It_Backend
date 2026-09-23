import { Express } from "express";
import { createServiceController } from "./create";
import { createPhotoServiceController } from "./create-photo-service";
import { createCheckListItemController } from "./create-check-list-item";
import { createCheckListController } from "./create-check-list";
import { findCheckListsController } from "./find-check-lists";
import { findPhotosController } from "./find-photos";

export async function serviceRoutes(app: Express) {
  app.post("/services", createServiceController);
  app.post("/services/:service_id/photos", createPhotoServiceController);
  app.get("/services/:service_id/photos", findPhotosController);
  app.post("/services/:service_id/check-lists", createCheckListController);
  app.get("/services/:service_id/check-lists", findCheckListsController);
  app.post("/check-lists/:check_list_id/items", createCheckListItemController);
}
