import { Request, Response } from "express";
import { z } from "zod";
import { ISkill } from "@/entities/models/skill.interface";
import { makeCreateSkillUseCase } from "@/use-cases/factory/staff/make-create-skill-usecase";

export async function createSkillController(req: Request, res: Response) {
  const registerBodySchema = z.object({
    name: z.string().min(1),
  });

  const { name } = registerBodySchema.parse(req.body);
  const skill: ISkill = { name };
  const createSkill = makeCreateSkillUseCase();
  const createdSkill = await createSkill.handle(skill);

  res.status(201).json({ message: "Skill created successfully", data: createdSkill });
}
