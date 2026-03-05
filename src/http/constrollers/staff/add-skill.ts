import { Request, Response } from "express";
import { z } from "zod";
import { StaffSkillEntity } from "@/entities/staff-skill.entity";
import { makeAddSkillToStaffUseCase } from "@/use-cases/factory/staff/make-add-skill-usecase";

export async function addSkillToStaffController(req: Request, res: Response) {
  const paramsSchema = z.object({
    staff_id: z.coerce.number(),
  });

  const bodySchema = z.object({
    skill_id: z.coerce.number(),
  });

  const { staff_id } = paramsSchema.parse(req.params);
  const { skill_id } = bodySchema.parse(req.body);

  const addSkillToStaff = makeAddSkillToStaffUseCase();
  const staffSkill = await addSkillToStaff.handle(new StaffSkillEntity(staff_id, skill_id));

  res.status(201).json({ message: "Skill added to staff successfully", data: staffSkill });
}
