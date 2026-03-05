import { Express } from "express";
import { createServiceController } from "./create";
import { createPhotoServiceController } from "./create-photo-service";
import { createCheckListItemController } from "./create-check-list-item";

export async function serviceRoutes(app: Express) {
  app.post("/services", createServiceController);
  app.post("/services/:service_id/photos", createPhotoServiceController);
  app.post("/check-lists/:check_list_id/items", createCheckListItemController);
}
