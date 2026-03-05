import { Request, Response } from "express";
import { z } from "zod";
import { makeFindStaffSkillsUseCase } from "@/use-cases/factory/staff/make-find-skills-usecase";

export async function findStaffSkillsController(req: Request, res: Response) {
  const paramsSchema = z.object({
    staff_id: z.coerce.number(),
  });

  const { staff_id } = paramsSchema.parse(req.params);
  const findStaffSkills = makeFindStaffSkillsUseCase();
  const skills = await findStaffSkills.handle(staff_id);

  res.status(200).json({ message: "Staff skills found successfully", data: skills });
}
