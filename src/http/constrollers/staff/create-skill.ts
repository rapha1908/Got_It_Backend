import { Request, Response } from "express";
import { z } from "zod";
import { SkillEntity } from "@/entities/skill.entity";
import { makeCreateSkillUseCase } from "@/use-cases/factory/staff/make-create-skill-usecase";

export async function createSkillController(req: Request, res: Response) {
  const registerBodySchema = z.object({
    name: z.string().min(1),
  });

  const { name } = registerBodySchema.parse(req.body);
  const createSkill = makeCreateSkillUseCase();
  const createdSkill = await createSkill.handle(new SkillEntity(name));

  res.status(201).json({ message: "Skill created successfully", data: createdSkill });
}
