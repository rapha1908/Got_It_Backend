import { Express } from "express";
import { createStaffController } from "./create";
import { findStaffController } from "./find";
import { createSkillController } from "./create-skill";
import { addSkillToStaffController } from "./add-skill";
import { findStaffSkillsController } from "./find-skills";

export async function staffRoutes(app: Express) {
  app.post("/staff", createStaffController);
  app.get("/staff/:user_id", findStaffController);
  app.post("/skills", createSkillController);
  app.post("/staff/:staff_id/skills", addSkillToStaffController);
  app.get("/staff/:staff_id/skills", findStaffSkillsController);
}
